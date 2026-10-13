import type { Page } from '@playwright/test';
export interface CursorHighlightOptions {
    /** Highlight ring color. Default: '#3b82f6' */
    color?: string;
    /** Radius of the highlight circle in px. Default: 20 */
    radius?: number;
    /** Show a pulsing glow around cursor. Default: true */
    pulse?: boolean;
    /** Show a ripple effect on click. Default: true */
    clickRipple?: boolean;
    /** Opacity of the highlight ring. Default: 0.5 */
    opacity?: number;
}
/**
 * Enables a persistent cursor highlight that follows the mouse pointer.
 * The highlight remains active until `resetCursor(page)` is called.
 * Calling again replaces the existing highlight.
 */
export declare function cursorHighlight(page: Page, opts?: CursorHighlightOptions): Promise<void>;
/**
 * Installs the cursor highlight only when one isn't already present.
 *
 * Used by the automatic (`video.cursorHighlight`) path after a navigation:
 * Playwright emits `framenavigated` for same-document history navigations too,
 * so an unconditional reinstall would rebuild the ring on every SPA route
 * change — resetting it off-screen until the next mouse event and leaking the
 * previous document listeners.
 */
export declare function ensureCursorHighlight(page: Page, opts?: CursorHighlightOptions): Promise<void>;
/**
 * Removes the cursor highlight and all related elements.
 */
export declare function resetCursor(page: Page): Promise<void>;
//# sourceMappingURL=cursor.d.ts.map