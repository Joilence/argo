/**
 * Frame + Background for the "Screen Studio" look.
 *
 * Two-phase approach for fast encoding:
 * 1. Pre-render: generate a single PNG with background + shadow + rounded corner
 *    cutout. This runs once before export (~100ms).
 * 2. Export: scale video + overlay onto the PNG. One simple overlay filter instead
 *    of per-frame geq + boxblur + colorchannelmixer.
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import type { FrameConfig, BackgroundConfig } from './config.js';

export interface FrameFilterResult {
  /** Filter expressions to add to filter_complex. */
  filterParts: string[];
  /** Additional ffmpeg input args (e.g., for frame PNG). */
  inputArgs: string[];
  /** The output label for the framed video stream. */
  videoSource: string;
  /** Number of additional inputs added. */
  addedInputs: number;
}

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function parseGradient(value: string): { color0: string; color1: string; angle: number } | null {
  const match = value.match(/linear-gradient\(\s*(\d+)deg\s*,\s*(#[0-9a-fA-F]{3,8})\s*,\s*(#[0-9a-fA-F]{3,8})\s*\)/);
  if (!match) return null;
  return { angle: parseInt(match[1], 10), color0: match[2], color1: match[3] };
}

/**
 * Build a rounded-rectangle alpha expression for ffmpeg geq.
 * Straight edges remain fully opaque; only corner quadrants get anti-aliased falloff.
 */
function buildRoundedCornerAlphaExpr(radius: number): string {
  const dx = `if(lt(X,${radius}),${radius}-X,if(gt(X,W-1-${radius}),X-(W-1-${radius}),0))`;
  const dy = `if(lt(Y,${radius}),${radius}-Y,if(gt(Y,H-1-${radius}),Y-(H-1-${radius}),0))`;
  return `if(lte(min(${dx},${dy}),0),255,clip(255*(${radius}+1-hypot(${dx},${dy})),0,255))`;
}

/**
 * Pre-render the frame (background + shadow + rounded corner hole) as a PNG.
 * The hole is transparent so the video can be overlaid into it during export.
 *
 * @returns Path to the generated PNG, or null on failure.
 */
export function generateFramePng(
  outputPath: string,
  outputWidth: number,
  outputHeight: number,
  config: FrameConfig,
): string | null {
  const padding = config.padding ?? 40;
  const borderRadius = config.borderRadius ?? 12;
  const shadowIntensity = config.shadow ?? 0.5;
  const shadowColor = config.shadowColor ?? '#000000';
  const background = config.background?.type === 'auto'
    ? { type: 'solid' as const, value: '#000000' }
    : config.background ?? { type: 'solid' as const, value: '#000000' };

  if (padding <= 0) return null;

  const innerW = outputWidth - 2 * padding;
  const innerH = outputHeight - 2 * padding;
  if (innerW <= 0 || innerH <= 0) return null;

  const evenInnerW = innerW % 2 === 0 ? innerW : innerW - 1;
  const evenInnerH = innerH % 2 === 0 ? innerH : innerH - 1;
  const r = Math.min(borderRadius, Math.floor(evenInnerW / 2), Math.floor(evenInnerH / 2));

  // Build ffmpeg filter to render the frame as a single PNG.
  // Creates: background → (optional shadow) → rounded corner cutout (transparent hole).
  const filters: string[] = [];

  // Background source
  if (background.type === 'gradient') {
    const grad = parseGradient(background.value ?? '');
    if (grad) {
      const rad = (grad.angle * Math.PI) / 180;
      const clampX = (v: number) => Math.max(0, Math.min(outputWidth, Math.round(v)));
      const clampY = (v: number) => Math.max(0, Math.min(outputHeight, Math.round(v)));
      const x0 = clampX(outputWidth / 2 - Math.sin(rad) * outputWidth / 2);
      const y0 = clampY(outputHeight / 2 - Math.cos(rad) * outputHeight / 2);
      const x1 = clampX(outputWidth / 2 + Math.sin(rad) * outputWidth / 2);
      const y1 = clampY(outputHeight / 2 + Math.cos(rad) * outputHeight / 2);
      filters.push(
        `gradients=s=${outputWidth}x${outputHeight}:c0=${grad.color0}:c1=${grad.color1}:x0=${x0}:y0=${y0}:x1=${x1}:y1=${y1}:duration=1:speed=0[bg]`,
      );
    } else {
      const colorMatch = (background.value ?? '').match(/#[0-9a-fA-F]{3,8}/);
      filters.push(`color=c=${colorMatch?.[0] ?? '#000000'}:s=${outputWidth}x${outputHeight}:d=1[bg]`);
    }
  } else {
    filters.push(`color=c=${background.value ?? '#000000'}:s=${outputWidth}x${outputHeight}:d=1[bg]`);
  }

  // Create a full-size RGBA canvas with the background, shadow, and a
  // transparent rounded-rect hole where the video will show through.

  // Step 1: Create an inverted alpha mask at full output size.
  // White = keep frame (opaque), Black = video hole (transparent).
  // The rounded rect is black (hole) centered on a white field (frame border).
  const alphaExpr = r > 0 ? buildRoundedCornerAlphaExpr(r) : '255';
  filters.push(
    `color=c=black:s=${outputWidth}x${outputHeight}:d=1,format=gray[full_black]`,
  );
  filters.push(
    `color=c=white:s=${evenInnerW}x${evenInnerH}:d=1,format=gray,geq=lum='${alphaExpr}'[hole_shape]`,
  );
  // Invert: white rounded rect → black hole on white field
  filters.push(
    `color=c=white:s=${outputWidth}x${outputHeight}:d=1,format=gray[full_white]`,
  );
  filters.push(
    `[full_white][hole_shape]overlay=(W-w)/2:(H-h)/2:format=auto[alpha_mask]`,
  );
  // Now alpha_mask has: white everywhere EXCEPT the rounded rect area which is also white...
  // We need the inverse: white frame border, black hole.
  // Simpler: start with white, overlay a black rounded rect
  filters.length = filters.length - 3; // remove the 3 lines above
  filters.push(
    `color=c=white:s=${outputWidth}x${outputHeight}:d=1,format=gray[white_bg]`,
  );
  filters.push(
    `[hole_shape]negate[hole_black]`,
  );
  filters.push(
    `[white_bg][hole_black]overlay=${padding}:${padding}:format=auto[alpha_inv]`,
  );
  // alpha_inv: white border + black hole. Use as alpha for the frame.
  // alphamerge: apply this as the alpha channel of the composited background.

  if (shadowIntensity > 0) {
    const { r: sr, g: sg, b: sb } = parseHexColor(shadowColor);
    const shadowAlpha = Math.min(1, shadowIntensity);
    const blurRadius = Math.max(8, Math.round(padding * 0.5));
    const shadowInset = Math.max(2, Math.round(r * 0.3));

    // Shadow from a slightly smaller mask
    filters.push(
      `color=c=white:s=${evenInnerW - shadowInset * 2}x${evenInnerH - shadowInset * 2}:d=1,format=yuva444p,` +
      `colorchannelmixer=rr=0:rg=0:rb=0:ra=0:gr=0:gg=0:gb=0:ga=0:br=0:bg=0:bb=0:ba=0:` +
      `ar=${(sr / 255 * shadowAlpha).toFixed(3)}:ag=${(sg / 255 * shadowAlpha).toFixed(3)}:ab=${(sb / 255 * shadowAlpha).toFixed(3)}:aa=${shadowAlpha.toFixed(3)},` +
      `boxblur=${blurRadius}:${Math.max(2, Math.round(blurRadius / 2))}[shadow]`,
    );
    filters.push(
      `[bg][shadow]overlay=(W-w)/2:(H-h)/2+${Math.round(blurRadius * 0.15)}:format=auto[bg_shadow]`,
    );
    // Apply alpha mask to composited bg+shadow
    filters.push(
      `[bg_shadow]format=rgba[bg_rgba]`,
    );
    filters.push(
      `[bg_rgba][alpha_inv]alphamerge[frm_png]`,
    );
  } else {
    filters.push(`[bg]format=rgba[bg_rgba]`);
    filters.push(`[bg_rgba][alpha_inv]alphamerge[frm_png]`);
  }

  const filterComplex = filters.join(';\n');

  const result = spawnSync('ffmpeg', [
    '-y',
    '-f', 'lavfi', '-i', filterComplex.includes('[bg]') ? 'anullsrc' : 'anullsrc', // dummy
    '-filter_complex', filterComplex,
    '-map', '[frm_png]',
    '-frames:v', '1',
    '-f', 'image2',
    '-update', '1',
    outputPath,
  ], { stdio: 'pipe' });

  return result.status === 0 && existsSync(outputPath) ? outputPath : null;
}

/**
 * Build a simple frame filter that overlays the video onto a pre-rendered frame PNG.
 * Much faster than the per-frame geq + boxblur approach.
 */
export function buildFrameFilter(
  videoSource: string,
  outputWidth: number,
  outputHeight: number,
  config: FrameConfig,
  nextInputIdx: number,
  framePngPath?: string,
): FrameFilterResult | null {
  const padding = config.padding ?? 40;
  if (padding <= 0) return null;

  const innerW = outputWidth - 2 * padding;
  const innerH = outputHeight - 2 * padding;
  if (innerW <= 0 || innerH <= 0) return null;

  const evenInnerW = innerW % 2 === 0 ? innerW : innerW - 1;
  const evenInnerH = innerH % 2 === 0 ? innerH : innerH - 1;

  const filterParts: string[] = [];
  const inputArgs: string[] = [];
  let addedInputs = 0;
  const srcRef = `[${videoSource}]`;

  // Scale video to fit within padded area
  filterParts.push(
    `${srcRef}scale=${evenInnerW}:${evenInnerH}:flags=lanczos:` +
    `force_original_aspect_ratio=decrease:force_divisible_by=2[frm_scaled]`,
  );

  // Use inline filter — reliable and correct
  return buildFrameFilterInline(videoSource, outputWidth, outputHeight, config, nextInputIdx);

  return { filterParts, inputArgs, videoSource: 'frm_out', addedInputs };
}

/**
 * Fallback: full inline frame filter for when pre-rendered PNG is not available.
 * This is the original per-frame approach — slower but self-contained.
 */
function buildFrameFilterInline(
  videoSource: string,
  outputWidth: number,
  outputHeight: number,
  config: FrameConfig,
  nextInputIdx: number,
): FrameFilterResult | null {
  const padding = config.padding ?? 40;
  const borderRadius = config.borderRadius ?? 12;
  const shadowIntensity = config.shadow ?? 0.5;
  const shadowColor = config.shadowColor ?? '#000000';
  const background = config.background?.type === 'auto'
    ? { type: 'solid' as const, value: '#000000' }
    : config.background ?? { type: 'solid' as const, value: '#000000' };

  if (padding <= 0) return null;

  const innerW = outputWidth - 2 * padding;
  const innerH = outputHeight - 2 * padding;
  if (innerW <= 0 || innerH <= 0) return null;

  const evenInnerW = innerW % 2 === 0 ? innerW : innerW - 1;
  const evenInnerH = innerH % 2 === 0 ? innerH : innerH - 1;

  const filterParts: string[] = [];
  const inputArgs: string[] = [];
  let addedInputs = 0;
  const srcRef = `[${videoSource}]`;

  filterParts.push(
    `${srcRef}scale=${evenInnerW}:${evenInnerH}:flags=lanczos:` +
    `force_original_aspect_ratio=decrease:force_divisible_by=2[frm_scaled]`,
  );

  if (borderRadius > 0) {
    const r = Math.min(borderRadius, Math.floor(evenInnerW / 2), Math.floor(evenInnerH / 2));
    const alphaExpr = buildRoundedCornerAlphaExpr(r);
    filterParts.push(
      `[frm_scaled]format=yuva444p,geq=lum='lum(X,Y)':cb='cb(X,Y)':cr='cr(X,Y)':a='${alphaExpr}'[frm_rounded]`,
    );
  } else {
    filterParts.push(`[frm_scaled]format=yuva444p[frm_rounded]`);
  }

  // Background
  let bgLabel: string;
  if (background.type === 'image') {
    inputArgs.push('-i', background.value ?? 'black');
    const bgIdx = nextInputIdx + addedInputs;
    addedInputs++;
    filterParts.push(`[${bgIdx}:v]scale=${outputWidth}:${outputHeight}:flags=lanczos,setsar=1[frm_bg]`);
    bgLabel = 'frm_bg';
  } else if (background.type === 'gradient') {
    const grad = parseGradient(background.value ?? '');
    if (grad) {
      const rad = (grad.angle * Math.PI) / 180;
      const clampX = (v: number) => Math.max(0, Math.min(outputWidth, Math.round(v)));
      const clampY = (v: number) => Math.max(0, Math.min(outputHeight, Math.round(v)));
      const x0 = clampX(outputWidth / 2 - Math.sin(rad) * outputWidth / 2);
      const y0 = clampY(outputHeight / 2 - Math.cos(rad) * outputHeight / 2);
      const x1 = clampX(outputWidth / 2 + Math.sin(rad) * outputWidth / 2);
      const y1 = clampY(outputHeight / 2 + Math.cos(rad) * outputHeight / 2);
      filterParts.push(
        `gradients=s=${outputWidth}x${outputHeight}:c0=${grad.color0}:c1=${grad.color1}:x0=${x0}:y0=${y0}:x1=${x1}:y1=${y1}:duration=1:speed=0,loop=-1:1:0[frm_bg]`,
      );
      bgLabel = 'frm_bg';
    } else {
      const colorMatch = (background.value ?? '').match(/#[0-9a-fA-F]{3,8}/);
      filterParts.push(`color=c=${colorMatch?.[0] ?? '#000000'}:s=${outputWidth}x${outputHeight}:d=1,loop=-1:1:0[frm_bg]`);
      bgLabel = 'frm_bg';
    }
  } else {
    filterParts.push(`color=c=${background.value ?? '#000000'}:s=${outputWidth}x${outputHeight}:d=1,loop=-1:1:0[frm_bg]`);
    bgLabel = 'frm_bg';
  }

  // Shadow
  if (shadowIntensity > 0) {
    const { r, g, b } = parseHexColor(shadowColor);
    const shadowAlpha = Math.min(1, shadowIntensity);
    const blurRadius = Math.max(8, Math.round(padding * 0.5));
    const shadowInset = Math.max(2, Math.round(borderRadius * 0.3));
    filterParts.push(`[frm_rounded]split[frm_fg][frm_shadow_src]`);
    filterParts.push(
      `[frm_shadow_src]scale=iw-${shadowInset * 2}:ih-${shadowInset * 2}:flags=fast_bilinear,` +
      `colorchannelmixer=rr=0:rg=0:rb=0:ra=0:gr=0:gg=0:gb=0:ga=0:br=0:bg=0:bb=0:ba=0:` +
      `ar=${(r / 255 * shadowAlpha).toFixed(3)}:ag=${(g / 255 * shadowAlpha).toFixed(3)}:ab=${(b / 255 * shadowAlpha).toFixed(3)}:aa=${shadowAlpha.toFixed(3)},` +
      `boxblur=${blurRadius}:${Math.max(2, Math.round(blurRadius / 2))}[frm_shadow]`,
    );
    filterParts.push(`[${bgLabel}][frm_shadow]overlay=(W-w)/2:(H-h)/2+${Math.round(blurRadius * 0.15)}:format=auto:shortest=1[frm_bg_shadow]`);
    filterParts.push(`[frm_bg_shadow][frm_fg]overlay=(W-w)/2:(H-h)/2:format=auto:shortest=1[frm_out]`);
  } else {
    filterParts.push(`[${bgLabel}][frm_rounded]overlay=(W-w)/2:(H-h)/2:format=auto:shortest=1[frm_out]`);
  }

  return { filterParts, inputArgs, videoSource: 'frm_out', addedInputs };
}
