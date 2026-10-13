import type { AccentColors } from './accent.js';
/**
 * Inline HTML template for the Playwright page used to render shader frames.
 * The page exposes two globals:
 *   window.__loadFrames(aDataUri, bDataUri) — uploads A/B textures
 *   window.__renderAt(progress) → Promise<string> — returns PNG as data URI
 */
export declare function buildShaderPageHtml(width: number, height: number, fragmentShaderGlsl: string, accent?: AccentColors): string;
//# sourceMappingURL=shader-page.html.d.ts.map