import type { Page } from '@playwright/test';
import type { NarrationTimeline } from './narration.js';
export interface RenderCompositionOptions {
    /** Scene name passed to `narration.mark()` and matched against
     *  `window.__timelines[scene]` for timeline resume. */
    scene: string;
    /** Hold duration in milliseconds. When omitted, falls back to the
     *  composition's `data-duration` attribute (in seconds), then 5000ms. */
    durationMs?: number;
    /** Optional video URL/path injected as `window.__argoVideoSrc` before
     *  the composition loads. Compositions consume this to texture an
     *  Argo recording onto a 3D device frame, etc. */
    videoSrc?: string;
    /** Override the readiness wait. Default 8000ms — long enough for
     *  GLTF model loads, short enough that a stuck composition fails fast. */
    readyTimeoutMs?: number;
    /** Root directory served by the composition HTTP server. Defaults to
     *  the directory two levels up from the composition (so `compositions/foo.html`
     *  resolves siblings like `models/bar.glb` at the project root). Override
     *  for compositions that live outside the standard `compositions/` layout. */
    serverRoot?: string;
}
export declare function renderComposition(page: Page, narration: NarrationTimeline, htmlPath: string, opts: RenderCompositionOptions): Promise<void>;
/**
 * Read a composition's declared duration from its `data-duration` attribute
 * without rendering it. Useful in `narration.durationFor()` callsites that
 * need the duration before the page navigates to the composition.
 */
export declare function readCompositionDuration(htmlPath: string): number | null;
//# sourceMappingURL=composition.d.ts.map