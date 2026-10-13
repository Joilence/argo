import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
export async function loadOverlayManifest(manifestPath) {
    if (!existsSync(manifestPath))
        return null;
    const raw = await readFile(manifestPath, 'utf-8');
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (err) {
        throw new Error(`Failed to parse overlay manifest ${manifestPath}: ${err.message}`);
    }
    if (!Array.isArray(parsed)) {
        throw new Error(`Overlay manifest ${manifestPath} must contain a JSON array`);
    }
    // Extract overlay entries from unified .scenes.json format (overlay nested under entry.overlay)
    const entries = [];
    for (const entry of parsed) {
        if (entry.overlay && entry.scene) {
            entries.push({ ...entry.overlay, scene: entry.scene });
        }
    }
    return entries;
}
export function hasImageAssets(entries) {
    return entries.some((e) => e.type === 'image-card');
}
export function resolveAssetURLs(entries, assetBaseURL) {
    return entries.map((e) => {
        if (e.type === 'image-card' && e.src && !e.src.startsWith('http')) {
            return { ...e, src: `${assetBaseURL}/${e.src.replace(/^assets\//, '')}` };
        }
        return e;
    });
}
//# sourceMappingURL=manifest.js.map