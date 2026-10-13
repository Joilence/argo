import { type Browser } from 'playwright';
import type { Placement } from '../tts/align.js';
import type { RenderedHfBlock } from './block-filter.js';
export declare function computeBlockHash(blockHtml: string, params: Record<string, string> | undefined, durationMs: number, fps: number, width: number, height: number, holdLastFrame?: boolean): string;
export interface RenderBlockFramesOptions {
    blockHtmlPath: string;
    outputDir: string;
    /** Window duration in the video (drives frame count and retiming). */
    durationMs: number;
    fps: number;
    /** Block canvas dimensions (native block size; compositing scales later). */
    width: number;
    height: number;
    /** CSS custom property overrides applied on document.documentElement. */
    params?: Record<string, string>;
    /** Pin the final timeline frame instead of linearly retiming. */
    holdLastFrame?: boolean;
    /** Reusable browser — pass one across multiple blocks for performance. */
    browser?: Browser;
}
export declare function renderBlockFrames(opts: RenderBlockFramesOptions): Promise<number>;
/**
 * A resolved `hf-block` overlay cue: manifest `overlay.type === 'hf-block'`
 * data merged with the placement window (scene timing) it plays over.
 */
export interface HfBlockCueResolved {
    name: string;
    params?: Record<string, string>;
    fit: 'cover' | {
        x: number;
        y: number;
        scale: number;
    };
    holdLastFrame: boolean;
    startMs: number;
    endMs: number;
}
export declare function resolveHfBlockCues(rawManifest: unknown[], placements: Placement[]): HfBlockCueResolved[];
export interface RenderHfBlocksOptions {
    cues: HfBlockCueResolved[];
    blocksDir: string;
    cacheDir: string;
    fps: number;
}
/**
 * Render (or reuse from cache) the PNG sequence for each resolved hf-block
 * cue. One `chromium` instance is shared across cache misses (launched
 * lazily, closed in `finally`) — mirrors the shader-render pre-pass pattern.
 */
export declare function renderHfBlocks(opts: RenderHfBlocksOptions): Promise<RenderedHfBlock[]>;
//# sourceMappingURL=block-render.d.ts.map