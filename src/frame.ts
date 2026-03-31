/**
 * Frame + Background filters for the "Screen Studio" look.
 *
 * Wraps the recording in a styled frame with padding, rounded corners,
 * drop shadow, and a configurable background (solid color, gradient, or image).
 *
 * FFmpeg filter chain:
 * 1. Scale video down to fit within padded area
 * 2. Apply rounded corners via alpha mask (geq)
 * 3. Create shadow layer (colorize black + blur)
 * 4. Create background (color source or input image)
 * 5. Composite: background → shadow → rounded video
 */

import type { FrameConfig, BackgroundConfig } from './config.js';

export interface FrameFilterResult {
  /** Filter expressions to add to filter_complex. */
  filterParts: string[];
  /** Additional ffmpeg input args (e.g., for background image). */
  inputArgs: string[];
  /** The output label for the framed video stream. */
  videoSource: string;
  /** Number of additional inputs added. */
  addedInputs: number;
}

/**
 * Parse a hex color string to r, g, b values (0-255).
 */
function parseHexColor(hex: string): { r: number; g: number; b: number } {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/**
 * Parse a CSS linear-gradient string to extract ffmpeg-compatible gradient info.
 * Supports: linear-gradient(angle, color1, color2)
 * Returns a simple two-stop gradient for ffmpeg gradients filter.
 */
function parseGradient(value: string): { color0: string; color1: string; angle: number } | null {
  const match = value.match(/linear-gradient\(\s*(\d+)deg\s*,\s*(#[0-9a-fA-F]{3,8})\s*,\s*(#[0-9a-fA-F]{3,8})\s*\)/);
  if (!match) return null;
  return {
    angle: parseInt(match[1], 10),
    color0: match[2],
    color1: match[3],
  };
}

/**
 * Build a rounded-rectangle alpha expression for ffmpeg geq.
 *
 * Straight edges remain fully opaque; only the corner quadrants get
 * anti-aliased falloff. This avoids the "background leaking along the whole
 * edge" artifact caused by treating every edge strip like a corner.
 */
function buildRoundedCornerAlphaExpr(radius: number): string {
  const dx =
    `if(lt(X,${radius}),${radius}-X,` +
    `if(gt(X,W-1-${radius}),X-(W-1-${radius}),0))`;
  const dy =
    `if(lt(Y,${radius}),${radius}-Y,` +
    `if(gt(Y,H-1-${radius}),Y-(H-1-${radius}),0))`;

  return `if(lte(min(${dx},${dy}),0),255,clip(255*(${radius}+1-hypot(${dx},${dy})),0,255))`;
}

/**
 * Build the ffmpeg filter_complex parts for the frame effect.
 *
 * @param videoSource - Current video stream label (e.g., '0:v' or 'camfinal')
 * @param outputWidth - Full output width in pixels
 * @param outputHeight - Full output height in pixels
 * @param config - Frame configuration
 * @param nextInputIdx - Next available input index (for background image)
 */
export function buildFrameFilter(
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
  const background = config.background ?? { type: 'solid' as const, value: '#000000' };

  if (padding <= 0) return null;

  const innerW = outputWidth - 2 * padding;
  const innerH = outputHeight - 2 * padding;
  if (innerW <= 0 || innerH <= 0) return null;

  // Ensure even dimensions
  const evenInnerW = innerW % 2 === 0 ? innerW : innerW - 1;
  const evenInnerH = innerH % 2 === 0 ? innerH : innerH - 1;

  const filterParts: string[] = [];
  const inputArgs: string[] = [];
  let addedInputs = 0;
  const srcRef = videoSource.includes(':') ? `[${videoSource}]` : `[${videoSource}]`;

  // Step 1: Scale video to fit within the padded area, preserving aspect ratio.
  // Do NOT pad here: equal X/Y padding changes the inner aspect ratio and creates
  // black bars for normal 16:9 recordings. We center the scaled stream later.
  filterParts.push(
    `${srcRef}scale=${evenInnerW}:${evenInnerH}:flags=lanczos:` +
    `force_original_aspect_ratio=decrease:force_divisible_by=2[frm_scaled]`,
  );

  // Step 2: Apply rounded corners if borderRadius > 0
  if (borderRadius > 0) {
    const r = Math.min(borderRadius, Math.floor(evenInnerW / 2), Math.floor(evenInnerH / 2));
    const alphaExpr = buildRoundedCornerAlphaExpr(r);
    // Rounded-corner alpha mask on yuva format.
    // Keep straight edges fully opaque and anti-alias only the corner arcs.
    filterParts.push(
      `[frm_scaled]format=yuva444p,` +
      `geq=` +
      `lum='lum(X,Y)':` +
      `cb='cb(X,Y)':` +
      `cr='cr(X,Y)':` +
      `a='${alphaExpr}'[frm_rounded]`,
    );
  } else {
    filterParts.push(`[frm_scaled]format=yuva444p[frm_rounded]`);
  }

  // Step 3: Create background
  let bgLabel: string;
  if (background.type === 'image') {
    // Background image input
    inputArgs.push('-i', background.value);
    const bgIdx = nextInputIdx + addedInputs;
    addedInputs++;
    filterParts.push(
      `[${bgIdx}:v]scale=${outputWidth}:${outputHeight}:flags=lanczos,setsar=1[frm_bg]`,
    );
    bgLabel = 'frm_bg';
  } else if (background.type === 'gradient') {
    const grad = parseGradient(background.value);
    if (grad) {
      // ffmpeg gradients filter: creates a two-color gradient
      // Convert angle to ffmpeg x0,y0,x1,y1 direction
      const { color0, color1, angle } = grad;
      const rad = (angle * Math.PI) / 180;
      // Clamp gradient endpoints to valid pixel range (gradients filter rejects negatives)
      const clampX = (v: number) => Math.max(0, Math.min(outputWidth, Math.round(v)));
      const clampY = (v: number) => Math.max(0, Math.min(outputHeight, Math.round(v)));
      const x0 = clampX(outputWidth / 2 - Math.sin(rad) * outputWidth / 2);
      const y0 = clampY(outputHeight / 2 - Math.cos(rad) * outputHeight / 2);
      const x1 = clampX(outputWidth / 2 + Math.sin(rad) * outputWidth / 2);
      const y1 = clampY(outputHeight / 2 + Math.cos(rad) * outputHeight / 2);
      // Generate one frame and loop infinitely so background covers full video duration
      filterParts.push(
        `gradients=s=${outputWidth}x${outputHeight}:` +
        `c0=${color0}:c1=${color1}:` +
        `x0=${x0}:y0=${y0}:x1=${x1}:y1=${y1}:` +
        `duration=1:speed=0,loop=-1:1:0[frm_bg]`,
      );
      bgLabel = 'frm_bg';
    } else {
      // Fallback: parse first color from gradient string or use black
      const colorMatch = background.value.match(/#[0-9a-fA-F]{3,8}/);
      const fallbackColor = colorMatch ? colorMatch[0] : '#000000';
      filterParts.push(
        `color=c=${fallbackColor}:s=${outputWidth}x${outputHeight}:d=1,loop=-1:1:0[frm_bg]`,
      );
      bgLabel = 'frm_bg';
    }
  } else {
    // Solid color — generate one frame and loop so overlay has infinite duration
    filterParts.push(
      `color=c=${background.value}:s=${outputWidth}x${outputHeight}:d=1,loop=-1:1:0[frm_bg]`,
    );
    bgLabel = 'frm_bg';
  }

  // Step 4: Create shadow (if enabled)
  if (shadowIntensity > 0) {
    const { r, g, b } = parseHexColor(shadowColor);
    const shadowAlpha = Math.min(1, shadowIntensity);
    const blurRadius = Math.max(8, Math.round(padding * 0.5));
    const shadowInset = Math.max(2, Math.round(borderRadius * 0.3));
    // Create shadow: scale down slightly so blur doesn't bleed past rounded corners,
    // then colorize to shadow color, apply alpha, blur.
    filterParts.push(
      `[frm_rounded]split[frm_fg][frm_shadow_src]`,
    );
    filterParts.push(
      `[frm_shadow_src]scale=iw-${shadowInset * 2}:ih-${shadowInset * 2}:flags=fast_bilinear,` +
      `colorchannelmixer=` +
      `rr=0:rg=0:rb=0:ra=0:` +
      `gr=0:gg=0:gb=0:ga=0:` +
      `br=0:bg=0:bb=0:ba=0:` +
      `ar=${(r / 255 * shadowAlpha).toFixed(3)}:ag=${(g / 255 * shadowAlpha).toFixed(3)}:ab=${(b / 255 * shadowAlpha).toFixed(3)}:aa=${shadowAlpha.toFixed(3)},` +
      `boxblur=${blurRadius}:${Math.max(2, Math.round(blurRadius / 2))}[frm_shadow]`,
    );

    // Composite: background → centered shadow (slightly smaller) → video
    filterParts.push(
      `[${bgLabel}][frm_shadow]overlay=(W-w)/2:(H-h)/2+${Math.round(blurRadius * 0.15)}:format=auto:shortest=1[frm_bg_shadow]`,
    );
    filterParts.push(
      `[frm_bg_shadow][frm_fg]overlay=(W-w)/2:(H-h)/2:format=auto:shortest=1[frm_out]`,
    );
  } else {
    // No shadow — composite directly on background
    filterParts.push(
      `[${bgLabel}][frm_rounded]overlay=(W-w)/2:(H-h)/2:format=auto:shortest=1[frm_out]`,
    );
  }

  return {
    filterParts,
    inputArgs,
    videoSource: 'frm_out',
    addedInputs,
  };
}
