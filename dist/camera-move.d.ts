/**
 * Post-export camera moves — ffmpeg zoompan filters for zoom/pan effects.
 *
 * Instead of manipulating the DOM during recording (fragile, interferes with
 * overlays), camera moves are captured as timing marks during recording and
 * applied as ffmpeg filters during export. This produces frame-exact,
 * overlay-safe zoom and pan effects using zoompan with time expressions.
 */
export interface CameraMove {
    /** Scene name this move belongs to (for debugging/reporting). */
    scene?: string;
    /** Start time on the export timeline (ms). */
    startMs: number;
    /** Duration of the camera move (ms). */
    durationMs: number;
    /** Target region center X in video pixels. */
    x: number;
    /** Target region center Y in video pixels. */
    y: number;
    /** Target region width in video pixels. */
    w: number;
    /** Target region height in video pixels. */
    h: number;
    /** Zoom scale (e.g. 1.5 = 150% magnification). Default: 1.5. */
    scale?: number;
    /** Hold the zoomed view for this many ms before zooming back out. Default: 0 (zoom in then immediately zoom out). */
    holdMs?: number;
}
/**
 * Detect which adjacent move pairs should be chained (smooth pan instead of bounce).
 * Returns a Set of indices where move[i] should chain into move[i+1].
 */
export declare function detectChainedPairs(moves: CameraMove[]): Set<number>;
/**
 * Build an ffmpeg filter expression for camera moves with connected handoffs.
 *
 * Adjacent moves within CHAIN_GAP_MS get smooth pans between them instead of
 * bouncing back to 1× zoom. The pan interpolates focus + scale with an ease-out
 * curve, creating cinematic connected camera motion.
 *
 * Uses ffmpeg's `if(between(t,...),expr,default)` for time-based animation.
 */
export declare function buildCameraMoveFilter(moves: CameraMove[], inputWidth: number, inputHeight: number, inputLabel: string, fps?: number): {
    filter: string;
    outputLabel: string;
} | null;
/**
 * Build an ffmpeg filter expression for motion blur applied after camera moves.
 *
 * Uses tblend to blend consecutive frames, creating a motion blur effect
 * during zoom/pan transitions. The intensity controls the blend opacity.
 *
 * @param inputLabel - Stream label of the camera move output (e.g., '[camfinal]')
 * @param intensity - Blur intensity from 0.0 to 1.0. Default: 0.5.
 * @returns Filter string and output label, or null if intensity is 0.
 */
export declare function buildMotionBlurFilter(inputLabel: string, intensity?: number, moves?: CameraMove[], fps?: number): {
    filter: string;
    outputLabel: string;
} | null;
/**
 * Shift camera moves by a time offset (for head trim alignment).
 */
export declare function shiftCameraMoves(moves: CameraMove[], offsetMs: number): CameraMove[];
/**
 * Remap camera move times from the recording timeline onto the export one.
 *
 * The ramp's `trim`/`setpts` segments run upstream of `zoompan`, so the
 * `in_time` a move matches against is the ramped timestamp, not the recorded
 * one. Both ends are remapped, not just the start: a move spanning a compressed
 * gap occupies less of the output timeline than it did of the recording, so
 * shifting without shrinking would leave the zoom running past its content.
 */
export declare function remapCameraMoves(moves: CameraMove[], remap: (timeMs: number) => number): CameraMove[];
/**
 * Compose the two rewrites a camera move has to survive, the speed ramp and any
 * freezes, into one recording-time to export-time mapping.
 *
 * Shared by every export path, since a correction that reaches some and not the
 * others diverges silently.
 */
export declare function exportTimelineRemap(remapForSpeedRamp: (timeMs: number) => number, freezes: readonly {
    absoluteMs: number;
    durationMs: number;
}[]): (timeMs: number) => number;
/**
 * Scale camera move coordinates from CSS layout pixels to output-frame pixels.
 * During recording, bounding boxes are measured in CSS pixels; export may
 * downscale, preserve, or upscale relative to that layout.
 */
export declare function scaleCameraMoves(moves: CameraMove[], scaleX: number, scaleY?: number): CameraMove[];
//# sourceMappingURL=camera-move.d.ts.map