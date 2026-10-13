import { showOverlay, hideOverlay, withOverlay } from './overlays/index.js';
/**
 * Show a lower-third caption for `durationMs`, then remove it.
 * @deprecated Use showOverlay() for new code.
 */
export async function showCaption(page, scene, text, durationMs) {
    await showOverlay(page, scene, { type: 'lower-third', text }, durationMs);
}
/**
 * Remove the caption overlay.
 * @deprecated Use hideOverlay() for new code.
 */
export async function hideCaption(page) {
    await hideOverlay(page, 'bottom-center');
}
/**
 * Show a caption while running `action`, then hide it (even on error).
 * @deprecated Use withOverlay() for new code.
 */
export async function withCaption(page, scene, text, action) {
    await withOverlay(page, scene, { type: 'lower-third', text }, action);
}
//# sourceMappingURL=captions.js.map