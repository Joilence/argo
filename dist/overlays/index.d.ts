import type { Page } from '@playwright/test';
import type { OverlayCue, Zone, MotionPreset } from './types.js';
export type { OverlayCue, OverlayManifestEntry, Zone, TemplateType, MotionPreset } from './types.js';
export type { SceneEntry } from './types.js';
export type { GsapMotion, GsapTween, GsapEase, GsapVars } from './gsap-motion.js';
export { renderTemplate } from './templates.js';
export type { BackgroundTheme } from './zones.js';
export { resetManifestCache } from './manifest-loader.js';
export declare function isRawGsapAllowed(): boolean;
/**
 * Resolve the motion for a cue. Order of precedence:
 *   1. `cue.motion` (explicit on the cue)
 *   2. `block.defaultMotion` when the cue is a block cue
 *   3. `'none'`
 */
export declare function resolveMotion(cue: OverlayCue): MotionPreset;
export declare function resolveCue(scene: string, cueOrPartial?: OverlayCue | Partial<OverlayCue>): OverlayCue;
export declare function showOverlay(page: Page, scene: string, durationMs: number): Promise<void>;
export declare function showOverlay(page: Page, scene: string, cue: OverlayCue | Partial<OverlayCue>, durationMs: number, options?: {
    autoBackground?: boolean;
}): Promise<void>;
export declare function hideOverlay(page: Page, zone?: Zone): Promise<void>;
export declare function withOverlay(page: Page, scene: string, action: () => Promise<void>): Promise<void>;
export declare function withOverlay(page: Page, scene: string, cue: OverlayCue | Partial<OverlayCue>, action: () => Promise<void>, options?: {
    autoBackground?: boolean;
}): Promise<void>;
//# sourceMappingURL=index.d.ts.map