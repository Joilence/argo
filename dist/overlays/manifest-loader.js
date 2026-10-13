import { readFileSync, existsSync } from 'node:fs';
let cachedManifest = null;
export function resetManifestCache() {
    cachedManifest = null;
}
function getManifest() {
    if (cachedManifest !== null)
        return cachedManifest;
    const manifestPath = process.env.ARGO_OVERLAYS_PATH;
    if (!manifestPath || !existsSync(manifestPath))
        return null;
    cachedManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    return cachedManifest;
}
export function loadOverlayFromManifest(scene) {
    const manifest = getManifest();
    if (!manifest)
        return undefined;
    const entry = manifest.find((e) => e.scene === scene);
    return entry?.overlay;
}
//# sourceMappingURL=manifest-loader.js.map