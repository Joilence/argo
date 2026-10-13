import type { Placement } from './tts/align.js';
/**
 * Specification for a freeze-frame hold at a particular point in the timeline.
 */
export interface FreezeSpec {
    /** Scene name this freeze belongs to. */
    scene: string;
    /** Offset in ms from the scene start where the frame should be frozen. */
    atMs: number;
    /** Duration in ms to hold the frozen frame. */
    durationMs: number;
}
/**
 * A freeze resolved to an absolute position on the (post-trim, pre-export) timeline.
 */
export interface ResolvedFreeze {
    /** Absolute time in ms where the freeze occurs. */
    absoluteMs: number;
    /** Duration in ms to hold the frozen frame. */
    durationMs: number;
}
/**
 * Resolve scene-relative freeze specs to absolute timeline positions using placements.
 *
 * Freezes whose scene is not found in placements are silently dropped.
 * The returned array is sorted chronologically.
 */
export declare function resolveFreezes(freezes: FreezeSpec[], placements: Placement[]): ResolvedFreeze[];
/**
 * Build an ffmpeg filter_complex expression that freezes specific frames.
 *
 * Strategy: split the video at each freeze point using trim, apply tpad to clone
 * the last frame for the freeze duration, then concatenate all segments.
 *
 * Freezes are processed in chronological order. Each freeze adds `durationMs`
 * to the total video length.
 *
 * @param freezes - Resolved freezes sorted chronologically.
 * @param totalDurationMs - Total video duration before freezes (used for the final trim).
 * @param inputLabel - The ffmpeg stream label for the video input (e.g. '0:v').
 * @returns The filter expression, output label, and total added duration — or null if no freezes.
 */
export declare function buildFreezeFilter(freezes: ResolvedFreeze[], totalDurationMs: number, inputLabel: string): {
    filter: string;
    outputLabel: string;
    addedDurationMs: number;
} | null;
/**
 * Shift placements, chapters, and subtitles forward to account for freeze-inserted duration.
 *
 * Each freeze at `absoluteMs` pushes everything after that point by `durationMs`.
 * Freezes must be sorted chronologically.
 */
export declare function adjustPlacementsForFreezes(placements: Placement[], freezes: ResolvedFreeze[]): Placement[];
/**
 * Compute the total duration added by all freezes.
 */
export declare function totalFreezeDurationMs(freezes: ResolvedFreeze[]): number;
//# sourceMappingURL=freeze.d.ts.map