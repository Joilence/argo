/**
 * Browser-side GSAP runtime: lazy-loads the GSAP UMD bundle into a Playwright
 * page and applies declarative motion tweens to overlay containers.
 *
 * GSAP's source is bundled with Argo via the `gsap` dependency; it is read from
 * `node_modules/gsap/dist/gsap.min.js` once per Node process and injected into
 * each page once via `page.addScriptTag({ content })`.
 */
import type { Page } from '@playwright/test';
import type { GsapMotion } from './gsap-motion.js';
/** Ensure `window.gsap` is available on the page. No-op on subsequent calls. */
export declare function ensureGsapInjected(page: Page): Promise<void>;
export type GsapPhase = 'in' | 'out' | 'loop';
/** Apply a single motion phase to the overlay container identified by `containerId`. */
export declare function runGsapMotion(page: Page, containerId: string, motion: GsapMotion, phase: GsapPhase): Promise<void>;
/** Fire entrance + loop (if any). Does NOT wait for the entrance to finish. */
export declare function runGsapEntrance(page: Page, containerId: string, motion: GsapMotion): Promise<void>;
/** Fire exit tween and wait its wall duration before returning. No-op if no `out`. */
export declare function runGsapExit(page: Page, containerId: string, motion: GsapMotion): Promise<void>;
/** Estimate how many ms the exit animation will occupy on the wall clock. */
export declare function gsapExitWallMs(motion: GsapMotion): number;
//# sourceMappingURL=gsap-runtime.d.ts.map