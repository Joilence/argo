/**
 * Render overlay cues to transparent PNGs using Playwright.
 *
 * For imported videos (no Playwright recording step), overlays defined in
 * .scenes.json are never burned into the video. This module renders each
 * overlay as a transparent PNG at the video's resolution so they can be
 * composited via ffmpeg's overlay filter with `enable` timeline.
 */
import type { OverlayCue, Zone } from './types.js';
import type { BackgroundTheme } from './zones.js';
import type { Placement } from '../tts/align.js';
export interface OverlayPngInput {
    scene: string;
    overlay: OverlayCue;
    startMs: number;
    endMs: number;
}
export interface RenderedOverlayPng {
    scene: string;
    pngPath: string;
    zone: Zone;
    startMs: number;
    endMs: number;
}
/**
 * Render overlay cues to transparent PNGs.
 *
 * Launches a headless Chromium browser, renders each overlay as a
 * full-page screenshot with transparent background, and saves them
 * to `outputDir`. PNGs are content-addressed cached — only regenerated
 * when the overlay definition or video dimensions change.
 *
 * @param overlays - Array of overlay cues with timing information
 * @param outputDir - Directory to save PNGs (e.g. `.argo/<demo>/overlay-pngs/`)
 * @param videoWidth - Width of the target video in pixels
 * @param videoHeight - Height of the target video in pixels
 * @param theme - Background theme for overlay styling, or per-overlay map keyed by scene name
 * @returns Array of rendered overlay PNGs with timing and position info
 */
export declare function renderOverlaysToPng(overlays: OverlayPngInput[], outputDir: string, videoWidth: number, videoHeight: number, theme?: BackgroundTheme | Record<string, BackgroundTheme>): Promise<RenderedOverlayPng[]>;
/**
 * Build ffmpeg filter_complex fragments to composite overlay PNGs onto a video.
 *
 * Each PNG is added as an input with `-loop 1` and overlaid using the
 * `enable='between(t,start,end)'` timeline filter.
 *
 * @param pngs - Rendered overlay PNGs with timing
 * @param baseInputCount - Number of ffmpeg inputs before overlay PNGs
 * @returns Object with additional ffmpeg args, filter parts, and updated input count
 */
export declare function buildOverlayPngFilters(pngs: RenderedOverlayPng[], baseInputCount: number, videoSourceLabel: string): {
    inputArgs: string[];
    filterParts: string[];
    videoSource: string;
    nextInput: number;
};
/**
 * Check if a demo is an imported video (has `.imported` marker).
 * For variants (e.g. `demo-mobile`), also checks the base demo name.
 */
export declare function isImportedVideo(argoDir: string, demoName: string): boolean;
/**
 * Build overlay PNGs for an imported video if overlays are defined.
 *
 * Shared across all export paths (CLI, pipeline, preview) to ensure parity.
 * Detects adaptive theme per-overlay from the video frame at each overlay's
 * time range — a dark section gets light overlays and vice versa.
 *
 * @returns Rendered overlay PNGs or undefined if not applicable
 */
export declare function buildOverlayPngsForImport(options: {
    argoDir: string;
    demoName: string;
    manifestPath: string;
    placements: Placement[];
    videoWidth: number;
    videoHeight: number;
    deviceScaleFactor?: number;
}): Promise<RenderedOverlayPng[] | undefined>;
//# sourceMappingURL=render-to-png.d.ts.map