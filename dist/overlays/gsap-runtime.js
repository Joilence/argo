/**
 * Browser-side GSAP runtime: lazy-loads the GSAP UMD bundle into a Playwright
 * page and applies declarative motion tweens to overlay containers.
 *
 * GSAP's source is bundled with Argo via the `gsap` dependency; it is read from
 * `node_modules/gsap/dist/gsap.min.js` once per Node process and injected into
 * each page once via `page.addScriptTag({ content })`.
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { tweenWallMs } from './gsap-motion.js';
const require = createRequire(import.meta.url);
let gsapSrcCache = null;
function loadGsapSource() {
    if (gsapSrcCache !== null)
        return gsapSrcCache;
    const gsapPath = require.resolve('gsap/dist/gsap.min.js');
    gsapSrcCache = readFileSync(gsapPath, 'utf8');
    return gsapSrcCache;
}
const injectedPages = new WeakSet();
/** Ensure `window.gsap` is available on the page. No-op on subsequent calls. */
export async function ensureGsapInjected(page) {
    if (injectedPages.has(page))
        return;
    const alreadyPresent = await page
        .evaluate(() => typeof window.gsap !== 'undefined')
        .catch(() => false);
    if (!alreadyPresent) {
        const src = loadGsapSource();
        await page.addScriptTag({ content: src });
    }
    injectedPages.add(page);
}
/** Apply a single motion phase to the overlay container identified by `containerId`. */
export async function runGsapMotion(page, containerId, motion, phase) {
    const tween = motion[phase];
    // Gate raw at the runtime as well as at `argo validate` — catches inline
    // cues that skip the validator.
    const rawAllowed = process.env.ARGO_ALLOW_RAW_GSAP === '1';
    const raw = phase === 'in' && rawAllowed ? motion.raw ?? null : null;
    if (!tween && !raw) {
        if (phase === 'in' && motion.raw && !rawAllowed) {
            // eslint-disable-next-line no-console
            console.warn('[argo] motion.raw ignored — set `overlays.allowRawGsap: true` to enable.');
        }
        return;
    }
    await ensureGsapInjected(page);
    await page.evaluate(({ containerId, tween, raw, phase }) => {
        const gsap = window.gsap;
        if (!gsap)
            return;
        const root = document.getElementById(containerId);
        if (!root)
            return;
        if (phase === 'out') {
            // Exit tween should not fight a running loop.
            gsap.killTweensOf(root);
            gsap.killTweensOf(root.querySelectorAll('*'));
        }
        if (phase === 'in' && raw) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-implied-eval
                const fn = new Function('gsap', 'root', raw);
                fn(gsap, root);
            }
            catch (err) {
                // eslint-disable-next-line no-console
                console.warn('[argo] gsap raw motion failed:', err);
            }
            return;
        }
        if (!tween)
            return;
        const targets = tween.target
            ? root.querySelectorAll(tween.target)
            : [root];
        if (targets.length === 0)
            return;
        const common = {
            duration: tween.duration ?? 0.4,
            ease: tween.ease ?? 'power2.out',
        };
        if (tween.delay !== undefined)
            common.delay = tween.delay;
        if (tween.stagger !== undefined)
            common.stagger = tween.stagger;
        if (tween.repeat !== undefined)
            common.repeat = tween.repeat;
        if (tween.yoyo !== undefined)
            common.yoyo = tween.yoyo;
        if (tween.fromTo) {
            gsap.fromTo(targets, { ...tween.fromTo.from }, { ...tween.fromTo.to, ...common });
        }
        else if (tween.from) {
            gsap.from(targets, { ...tween.from, ...common });
        }
        else if (tween.to) {
            gsap.to(targets, { ...tween.to, ...common });
        }
    }, { containerId, tween: tween ?? null, raw, phase });
}
/** Fire entrance + loop (if any). Does NOT wait for the entrance to finish. */
export async function runGsapEntrance(page, containerId, motion) {
    await runGsapMotion(page, containerId, motion, 'in');
    if (motion.loop) {
        await runGsapMotion(page, containerId, motion, 'loop');
    }
}
/** Fire exit tween and wait its wall duration before returning. No-op if no `out`. */
export async function runGsapExit(page, containerId, motion) {
    if (!motion.out)
        return;
    await runGsapMotion(page, containerId, motion, 'out');
    await page.waitForTimeout(tweenWallMs(motion.out));
}
/** Estimate how many ms the exit animation will occupy on the wall clock. */
export function gsapExitWallMs(motion) {
    return tweenWallMs(motion.out);
}
//# sourceMappingURL=gsap-runtime.js.map