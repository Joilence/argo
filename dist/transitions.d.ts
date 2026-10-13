import type { Placement } from './tts/align.js';
import type { TransitionConfig } from './config.js';
export interface ShaderDeferredMarker {
    shaderDeferred: true;
}
/**
 * Generate ffmpeg transition filters for scene boundaries.
 *
 * Returns either:
 * - Simple string[] for -vf (wipe transitions only)
 * - A filterComplex object for filter_complex (fade/dissolve — uses split+trim+fade+concat)
 * - A ShaderDeferredMarker sentinel when type === 'shader' (export.ts wires PNG sequences)
 */
export declare function buildTransitionFilters(placements: Placement[], transition: TransitionConfig, hasAudio?: boolean, fps?: number): string[] | {
    filterComplex: string;
    videoOutput: string;
    audioOutput: string | null;
} | ShaderDeferredMarker;
//# sourceMappingURL=transitions.d.ts.map