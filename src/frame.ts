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

  // Generate a single-frame PNG with the background and a transparent
  // rounded-rect hole. Uses geq on the full-size image to punch the hole
  // directly in the alpha channel — no separate mask compositing needed.

  // Build the background source filter
  let bgFilter: string;
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
      bgFilter = `gradients=s=${outputWidth}x${outputHeight}:c0=${grad.color0}:c1=${grad.color1}:x0=${x0}:y0=${y0}:x1=${x1}:y1=${y1}:duration=1:speed=0,format=rgba`;
    } else {
      const colorMatch = (background.value ?? '').match(/#[0-9a-fA-F]{3,8}/);
      bgFilter = `color=c=${colorMatch?.[0] ?? '#000000'}:s=${outputWidth}x${outputHeight}:d=1,format=rgba`;
    }
  } else {
    bgFilter = `color=c=${background.value ?? '#000000'}:s=${outputWidth}x${outputHeight}:d=1,format=rgba`;
  }

  // Build geq that punches a transparent rounded-rect hole in the alpha channel.
  // Inside the padded rect: alpha = 0 (transparent hole, anti-aliased corners).
  // Outside: alpha = 255 (opaque frame border).
  const x1 = padding;
  const y1 = padding;
  const x2 = padding + evenInnerW - 1;
  const y2 = padding + evenInnerH - 1;

  // Corner distance from the inner rect edge (relative to the inner rect)
  // Use \\, for comma escaping — ffmpeg -vf parser treats commas as filter separators
  const e = '\\,'; // escaped comma for ffmpeg expressions
  const dx = `if(lt(X-${x1}${e}${r})${e}${r}-(X-${x1})${e}if(gt(X-${x1}${e}${evenInnerW - 1 - r})${e}(X-${x1})-(${evenInnerW - 1 - r})${e}0))`;
  const dy = `if(lt(Y-${y1}${e}${r})${e}${r}-(Y-${y1})${e}if(gt(Y-${y1}${e}${evenInnerH - 1 - r})${e}(Y-${y1})-(${evenInnerH - 1 - r})${e}0))`;

  let holeAlpha: string;
  if (r > 0) {
    holeAlpha = `if(between(X${e}${x1}${e}${x2})*between(Y${e}${y1}${e}${y2})${e}` +
      `if(lte(min(${dx}${e}${dy})${e}0)${e}0${e}clip(255-255*(${r}+1-hypot(${dx}${e}${dy}))${e}0${e}255))${e}255)`;
  } else {
    holeAlpha = `if(between(X${e}${x1}${e}${x2})*between(Y${e}${y1}${e}${y2})${e}0${e}255)`;
  }

  const vf = `geq=r='r(X${e}Y)':g='g(X${e}Y)':b='b(X${e}Y)':a='${holeAlpha}'`;

  const result = spawnSync('ffmpeg', [
    '-y',
    '-f', 'lavfi', '-i', bgFilter,
    '-vf', vf,
    '-frames:v', '1',
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

  if (framePngPath && existsSync(framePngPath)) {
    // Fast path: pad video to full size, overlay frame PNG on top.
    // The PNG has a transparent hole — video shows through.
    const pngIdx = nextInputIdx + addedInputs;
    inputArgs.push('-i', framePngPath);
    addedInputs++;

    filterParts.push(
      `[frm_scaled]pad=${outputWidth}:${outputHeight}:(ow-iw)/2:(oh-ih)/2:black[frm_padded]`,
    );
    filterParts.push(
      `[${pngIdx}:v]loop=-1:1:0,setpts=N/FRAME_RATE/TB[frm_png]`,
    );
    filterParts.push(
      `[frm_padded][frm_png]overlay=0:0:format=auto:shortest=1[frm_out]`,
    );
  } else {
    return buildFrameFilterInline(videoSource, outputWidth, outputHeight, config, nextInputIdx);
  }

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
