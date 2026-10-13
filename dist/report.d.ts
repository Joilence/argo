import type { Placement } from './tts/align.js';
export interface SceneReport {
    demo: string;
    totalDurationMs: number;
    overflowMs: number;
    scenes: {
        scene: string;
        startMs: number;
        endMs: number;
        durationMs: number;
    }[];
    output: string;
}
export declare function buildSceneReport(demo: string, placements: Placement[], overflowMs: number, totalDurationMs: number, outputPath: string): SceneReport;
export declare function formatSceneReport(report: SceneReport): string;
//# sourceMappingURL=report.d.ts.map