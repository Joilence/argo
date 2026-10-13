export type SceneTiming = Record<string, number>;
export interface ClipInfo {
    scene: string;
    durationMs: number;
    samples: Float32Array;
}
export interface Placement {
    scene: string;
    startMs: number;
    endMs: number;
}
export interface AlignResult {
    placements: Placement[];
    samples: Float32Array;
    requiredDurationMs: number;
    overflowMs: number;
}
export interface ScheduledSceneInput {
    scene: string;
    startMs: number;
    durationMs: number;
}
export declare const OVERLAP_GAP_MS = 100;
export declare function schedulePlacements(scenes: ScheduledSceneInput[]): Placement[];
export declare function alignClips(timing: SceneTiming, clips: ClipInfo[], totalDurationMs: number, sampleRate?: number): AlignResult;
//# sourceMappingURL=align.d.ts.map