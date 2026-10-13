import { type Browser } from '@playwright/test';
import { type ShaderName } from './shaders/index.js';
/**
 * Content hash keying the shader render cache. Includes every input that can
 * affect output: shader source, timing parameters, resolution, the content
 * of the two boundary frames, and the accent color.
 */
export declare function computeShaderHash(shader: string, durationMs: number, fps: number, width: number, height: number, aPngPath: string, bPngPath: string, accentHex?: string): string;
/**
 * Extract a single frame from a video at the given timestamp (seconds) using
 * ffmpeg. The output is a PNG at the source video's native resolution.
 *
 * Uses `-ss BEFORE -i` for seek acceptable for boundary-frame grabs
 * (one-frame precision not required — gl-transitions uses frozen frames).
 */
export declare function extractBoundaryFrame(videoPath: string, timestampSec: number, outputPngPath: string): Promise<void>;
export interface RenderShaderFramesOptions {
    shader: ShaderName;
    aPng: string;
    bPng: string;
    width: number;
    height: number;
    fps: number;
    durationMs: number;
    outputDir: string;
    /** Reusable browser — pass one across multiple boundaries for performance. */
    browser?: Browser;
    /** Accent hex for shaders using accent uniforms. Default DEFAULT_ACCENT. */
    accent?: string;
}
/**
 * Render a GLSL shader transition as a PNG sequence.
 * Produces `outputDir/frame_0000.png` ... `frame_{N-1}.png` where
 * N = Math.round(durationMs * fps / 1000).
 *
 * Launches Playwright Chromium if a browser is not passed in. Callers with
 * multiple boundaries should share a single browser across calls.
 */
export declare function renderShaderFrames(opts: RenderShaderFramesOptions): Promise<number>;
export interface BoundarySpec {
    boundarySec: number;
    durationMs: number;
}
export interface ShaderTransitionRenderResult {
    boundarySec: number;
    durationMs: number;
    pngDir: string;
    frameCount: number;
    hash: string;
}
/**
 * For each scene boundary, extract two boundary frames, compute a content
 * hash, and render the shader's PNG sequence if not already cached.
 * Reuses a single Playwright browser across all boundaries.
 */
export declare function renderShaderTransitions(opts: {
    videoPath: string;
    boundaries: BoundarySpec[];
    shader: ShaderName;
    width: number;
    height: number;
    fps: number;
    cacheDir: string;
    /** Accent hex for shaders using accent uniforms. Default DEFAULT_ACCENT. */
    accent?: string;
}): Promise<ShaderTransitionRenderResult[]>;
//# sourceMappingURL=shader-render.d.ts.map