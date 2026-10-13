/**
 * Frame + Background for the "Screen Studio" look.
 *
 * Two-phase approach for fast encoding:
 * 1. Pre-render: generate a single PNG with background + shadow + rounded corner
 *    cutout. This runs once before export (~100ms).
 * 2. Export: scale video + overlay onto the PNG. One simple overlay filter instead
 *    of per-frame geq + boxblur + colorchannelmixer.
 */
import type { FrameConfig } from './config.js';
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
/**
 * Pre-render the frame (background + shadow + rounded corner hole) as a PNG.
 * The hole is transparent so the video can be overlaid into it during export.
 *
 * @returns Path to the generated PNG, or null on failure.
 */
export declare function generateFramePng(outputPath: string, outputWidth: number, outputHeight: number, config: FrameConfig): string | null;
/**
 * Build a simple frame filter that overlays the video onto a pre-rendered frame PNG.
 * Much faster than the per-frame geq + boxblur approach.
 */
export declare function buildFrameFilter(videoSource: string, outputWidth: number, outputHeight: number, config: FrameConfig, nextInputIdx: number, framePngPath?: string): FrameFilterResult | null;
//# sourceMappingURL=frame.d.ts.map