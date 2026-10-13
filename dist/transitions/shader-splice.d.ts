export interface ShaderBoundary {
    boundarySec: number;
    durationMs: number;
    /** ffmpeg input index for this boundary's PNG sequence (image2 demuxer). */
    extraInputIndex: number;
}
export interface ShaderSpliceOptions {
    totalDurationSec: number;
    boundaries: ShaderBoundary[];
    videoInputLabel: string;
    audioInputLabel: string | null;
    fps: number;
}
export interface ShaderSpliceResult {
    filterComplex: string;
    videoOutput: string;
    audioOutput: string | null;
}
/**
 * Splice shader PNG sequences into the scene concat at each boundary.
 *
 * Produces (2K+1) segments for K boundaries: scene_a_0 + trans_0 + scene_a_1 + trans_1 + ... + scene_a_K
 * Audio passes through at boundaries, trimmed to match.
 */
export declare function buildShaderSpliceFilter(opts: ShaderSpliceOptions): ShaderSpliceResult;
//# sourceMappingURL=shader-splice.d.ts.map