import type { Placement } from './tts/align.js';
import type { SpeedRampConfig } from './config.js';
export interface Segment {
    startMs: number;
    endMs: number;
    speed: number;
}
/**
 * Per-scene playback speed overrides, keyed by scene name.
 */
export type SceneSpeedMap = Record<string, number>;
/**
 * Identify gap segments between scene placements and mark them for speed-up.
 * Also applies per-scene playback speed overrides when provided.
 */
export declare function computeSegments(placements: Placement[], totalDurationMs: number, config: SpeedRampConfig, sceneSpeeds?: SceneSpeedMap): Segment[];
export declare function remapTimeMs(timeMs: number, segments: Segment[]): number;
export declare function applySpeedRampToTimeline(placements: Placement[], totalDurationMs: number, config?: SpeedRampConfig, sceneSpeeds?: SceneSpeedMap): {
    placements: Placement[];
    totalDurationMs: number;
    segments: Segment[];
};
/**
 * Build ffmpeg filter_complex for speed ramping.
 *
 * Splits the input into segments, applies setpts (video) and atempo (audio)
 * to gap segments, then concatenates everything back together.
 */
export declare function buildSpeedRampFilter(segments: Segment[], inputs: {
    video: string;
    audio?: string;
}): {
    filterComplex: string;
    outputLabels: {
        video: string;
        audio?: string;
    };
} | null;
/**
 * Apply speed ramp to an already-exported MP4.
 * Replaces the file in-place (writes to temp, then renames).
 */
export declare function applySpeedRamp(inputPath: string, segments: Segment[], hasAudio: boolean, preset: string, crf: number): Promise<void>;
//# sourceMappingURL=speed-ramp.d.ts.map