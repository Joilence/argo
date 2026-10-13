import type { BackgroundTheme } from './overlays/zones.js';
export declare function getVideoDurationMs(videoPath: string): number;
export declare function getVideoFrameRate(videoPath: string): number;
/**
 * Detect whether a video region is predominantly dark or light.
 * Samples multiple frames across the given time range for robustness
 * (a single frame might be a transition or black screen).
 *
 * Returns the *overlay* theme for contrast: dark video → 'light' overlay,
 * light video → 'dark' overlay. Falls back to 'dark' on error.
 */
export declare function detectVideoTheme(videoPath: string, startMs?: number, endMs?: number): BackgroundTheme;
/**
 * Extract the two most dominant colors from the edges of a video frame.
 *
 * Samples a frame near the middle of the video, crops thin strips from all
 * four edges, downscales to a tiny resolution, and clusters the pixel colors
 * into two buckets. Returns the two hex colors sorted dark-to-light, suitable
 * for a gradient background that blends with the video content.
 *
 * Returns null on failure (best-effort — caller should fall back to a default).
 */
export declare function probeEdgeColors(videoPath: string, timestampMs?: number): {
    color0: string;
    color1: string;
} | null;
/**
 * Probe video dimensions (width × height) using ffprobe.
 * Returns { width, height } or null on failure.
 */
export declare function getVideoDimensions(videoPath: string): {
    width: number;
    height: number;
} | null;
//# sourceMappingURL=media.d.ts.map