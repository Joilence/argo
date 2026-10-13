import type { Page } from '@playwright/test';
/**
 * Show a lower-third caption for `durationMs`, then remove it.
 * @deprecated Use showOverlay() for new code.
 */
export declare function showCaption(page: Page, scene: string, text: string, durationMs: number): Promise<void>;
/**
 * Remove the caption overlay.
 * @deprecated Use hideOverlay() for new code.
 */
export declare function hideCaption(page: Page): Promise<void>;
/**
 * Show a caption while running `action`, then hide it (even on error).
 * @deprecated Use withOverlay() for new code.
 */
export declare function withCaption(page: Page, scene: string, text: string, action: () => Promise<void>): Promise<void>;
//# sourceMappingURL=captions.d.ts.map