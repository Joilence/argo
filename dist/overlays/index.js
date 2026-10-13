import { injectIntoZone, removeZone, ZONE_ID_PREFIX, detectBackgroundTheme } from './zones.js';
import { renderTemplate } from './templates.js';
import { getMotionCSS, getMotionStyles } from './motion.js';
import { isGsapMotion } from './gsap-motion.js';
import { runGsapEntrance, runGsapExit, gsapExitWallMs } from './gsap-runtime.js';
import { loadOverlayFromManifest } from './manifest-loader.js';
import { getBlock, isValidBlockName } from '../blocks/index.js';
import { applyComponent, removeComponent } from '../hf/apply-component.js';
export { renderTemplate } from './templates.js';
export { resetManifestCache } from './manifest-loader.js';
function getConfigAutoBackground() {
    return process.env.ARGO_AUTO_BACKGROUND === '1';
}
function getConfigDefaultPlacement() {
    const val = process.env.ARGO_DEFAULT_PLACEMENT;
    if (val && ['bottom-center', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'].includes(val)) {
        return val;
    }
    return undefined;
}
export function isRawGsapAllowed() {
    return process.env.ARGO_ALLOW_RAW_GSAP === '1';
}
async function resolveTheme(page, cue, zone, optionsAutoBackground) {
    const shouldDetect = cue.autoBackground ?? optionsAutoBackground ?? getConfigAutoBackground();
    if (!shouldDetect)
        return 'dark';
    return detectBackgroundTheme(page, zone);
}
/**
 * Resolve the motion for a cue. Order of precedence:
 *   1. `cue.motion` (explicit on the cue)
 *   2. `block.defaultMotion` when the cue is a block cue
 *   3. `'none'`
 */
export function resolveMotion(cue) {
    if (cue.motion !== undefined)
        return cue.motion;
    if (cue.type === 'block' && isValidBlockName(cue.block)) {
        const block = getBlock(cue.block);
        if (block.defaultMotion !== undefined)
            return block.defaultMotion;
    }
    return 'none';
}
export function resolveCue(scene, cueOrPartial) {
    const manifestCue = loadOverlayFromManifest(scene);
    if (cueOrPartial && 'type' in cueOrPartial && cueOrPartial.type) {
        // Full inline cue — merge with manifest if available
        return manifestCue ? { ...manifestCue, ...cueOrPartial } : cueOrPartial;
    }
    if (manifestCue) {
        // Manifest cue with optional overrides
        return cueOrPartial ? { ...manifestCue, ...cueOrPartial } : manifestCue;
    }
    throw new Error(`No overlay found for scene "${scene}". ` +
        `Either add an overlay entry in your .scenes.json manifest, or pass an inline cue.`);
}
export async function showOverlay(page, scene, cueOrDuration, durationMsOrOptions, options) {
    let cue;
    let durationMs;
    let opts;
    if (typeof cueOrDuration === 'number') {
        // showOverlay(page, scene, durationMs)
        cue = resolveCue(scene);
        durationMs = cueOrDuration;
        opts = undefined;
    }
    else {
        // showOverlay(page, scene, cue, durationMs, options?)
        cue = resolveCue(scene, cueOrDuration);
        durationMs = durationMsOrOptions;
        opts = options;
    }
    if (cue.type === 'hf-component') {
        // Full-frame component — bypasses zone/theme/template machinery.
        await applyComponent(page, cue.name, { params: cue.params });
        await page.waitForTimeout(durationMs);
        await removeComponent(page, cue.name);
        return;
    }
    if (cue.type === 'hf-block') {
        // Export-time cutaway — nothing is injected during recording, but the
        // wait preserves the demo script's scene pacing.
        await page.waitForTimeout(durationMs);
        return;
    }
    const zone = cue.placement ?? getConfigDefaultPlacement() ?? 'bottom-center';
    const motion = resolveMotion(cue);
    const theme = await resolveTheme(page, cue, zone, opts?.autoBackground);
    const { contentHtml, styles } = renderTemplate(cue, theme);
    const zoneId = ZONE_ID_PREFIX + zone;
    const motionCSS = getMotionCSS(motion, zoneId);
    const motionStyles = getMotionStyles(motion, zoneId);
    // Tag this overlay instance so removeZone only removes it if it hasn't
    // been replaced by a newer overlay in the same zone (fire-and-forget safe).
    const instanceId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await injectIntoZone(page, zone, contentHtml, { ...styles, ...motionStyles }, motionCSS, instanceId);
    if (isGsapMotion(motion)) {
        await runGsapEntrance(page, zoneId, motion);
        const exitMs = gsapExitWallMs(motion);
        const holdMs = Math.max(0, durationMs - exitMs);
        await page.waitForTimeout(holdMs);
        if (motion.out)
            await runGsapExit(page, zoneId, motion);
    }
    else {
        await page.waitForTimeout(durationMs);
    }
    await removeZone(page, zone, instanceId);
}
export async function hideOverlay(page, zone = 'bottom-center') {
    await removeZone(page, zone);
}
export async function withOverlay(page, scene, cueOrAction, actionOrOptions, options) {
    let cue;
    let action;
    let opts;
    if (typeof cueOrAction === 'function') {
        // withOverlay(page, scene, action)
        cue = resolveCue(scene);
        action = cueOrAction;
        opts = undefined;
    }
    else {
        // withOverlay(page, scene, cue, action, options?)
        cue = resolveCue(scene, cueOrAction);
        action = actionOrOptions;
        opts = options;
    }
    if (cue.type === 'hf-component') {
        await applyComponent(page, cue.name, { params: cue.params });
        try {
            return await action();
        }
        finally {
            await removeComponent(page, cue.name);
        }
    }
    if (cue.type === 'hf-block') {
        return await action();
    }
    const zone = cue.placement ?? getConfigDefaultPlacement() ?? 'bottom-center';
    const motion = resolveMotion(cue);
    const theme = await resolveTheme(page, cue, zone, opts?.autoBackground);
    const { contentHtml, styles } = renderTemplate(cue, theme);
    const zoneId = ZONE_ID_PREFIX + zone;
    const motionCSS = getMotionCSS(motion, zoneId);
    const motionStyles = getMotionStyles(motion, zoneId);
    const instanceId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await injectIntoZone(page, zone, contentHtml, { ...styles, ...motionStyles }, motionCSS, instanceId);
    if (isGsapMotion(motion)) {
        await runGsapEntrance(page, zoneId, motion);
    }
    try {
        await action();
    }
    finally {
        if (isGsapMotion(motion) && motion.out) {
            await runGsapExit(page, zoneId, motion);
        }
        await removeZone(page, zone, instanceId);
    }
}
//# sourceMappingURL=index.js.map