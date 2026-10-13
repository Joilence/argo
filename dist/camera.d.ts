import type { Page } from '@playwright/test';
import type { NarrationTimeline } from './narration.js';
interface CameraOptions {
    duration?: number;
    fadeIn?: number;
    fadeOut?: number;
    wait?: boolean;
}
export interface SpotlightOptions extends CameraOptions {
    opacity?: number;
    padding?: number;
    /**
     * Corner radius of the cutout, in px. Default 10. Pass 0 for square corners,
     * which on a pill button read as a crop rather than as a highlight.
     */
    radius?: number;
    /**
     * Blur radius applied to the cutout's edge, in px. Default 12; 0 gives a hard
     * edge. The visible ramp runs a little over twice this value. Past about a
     * third of the cutout's shorter side it outgrows the filter region below and
     * the ramp is cut off partway, showing as a faint square edge.
     */
    feather?: number;
}
export interface FocusRingOptions extends CameraOptions {
    color?: string;
    width?: number;
    pulse?: boolean;
}
export interface DimAroundOptions extends CameraOptions {
    dimOpacity?: number;
}
export interface ZoomToOptions extends CameraOptions {
    /** Zoom level — 1.5 means 150% magnification. Default: 1.5 */
    scale?: number;
    /** Hold the zoomed view for this many ms before zooming back out. Default: 0. */
    holdMs?: number;
    /**
     * When provided, records the zoom as a post-export camera move (ffmpeg crop+scale)
     * instead of applying a browser-side CSS transform. This produces frame-exact,
     * overlay-safe zoom effects. Pass the narration fixture instance.
     */
    narration?: NarrationTimeline;
}
export type SelectorOrLocator = string | {
    boundingBox: () => Promise<{
        x: number;
        y: number;
        width: number;
        height: number;
    } | null>;
};
export declare function spotlight(page: Page, selectorOrLocator: SelectorOrLocator, opts?: SpotlightOptions): Promise<void>;
export declare function focusRing(page: Page, selectorOrLocator: SelectorOrLocator, opts?: FocusRingOptions): Promise<void>;
export declare function dimAround(page: Page, selectorOrLocator: SelectorOrLocator, opts?: DimAroundOptions): Promise<void>;
export declare function zoomTo(page: Page, selectorOrLocator: SelectorOrLocator, opts?: ZoomToOptions): Promise<void>;
export declare function resetCamera(page: Page): Promise<void>;
/**
 * Start tracking cursor positions for dwell-based camera suggestions.
 *
 * Injects a throttled mousemove listener into the page that records
 * normalized (0..1) cursor positions. Call once at the start of the
 * demo script — positions are flushed to a sidecar file by the fixture.
 *
 * Non-blocking, fire-and-forget safe.
 */
export declare function trackCursor(page: Page, narration: NarrationTimeline): Promise<void>;
export {};
//# sourceMappingURL=camera.d.ts.map