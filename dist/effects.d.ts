import type { Page } from '@playwright/test';
export interface ConfettiOptions {
    /** Milliseconds before auto-fade. Default: 3000 */
    duration?: number;
    /** Number of confetti pieces. Default: 150 */
    pieces?: number;
    /** 'burst' fans from center-top (Raycast-style), 'rain' falls across full width. Default: 'burst' */
    spread?: 'burst' | 'rain';
    /** Hex color strings for confetti pieces. Default: blue, cyan, green, amber, red, purple. Ignored when emoji is set. */
    colors?: string[];
    /** Emoji character(s) to use instead of colored rectangles. e.g. '🎃' for Halloween, '🎄' for Christmas. */
    emoji?: string | string[];
    /** Fade-out duration in ms. Default: 800 */
    fadeOut?: number;
    /** Block until animation completes. Default: false (non-blocking, fire-and-forget safe). */
    wait?: boolean;
}
export declare function showConfetti(page: Page, opts?: ConfettiOptions): Promise<void>;
//# sourceMappingURL=effects.d.ts.map