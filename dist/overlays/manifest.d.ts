import type { OverlayManifestEntry } from './types.js';
export declare function loadOverlayManifest(manifestPath: string): Promise<OverlayManifestEntry[] | null>;
export declare function hasImageAssets(entries: OverlayManifestEntry[]): boolean;
export declare function resolveAssetURLs(entries: OverlayManifestEntry[], assetBaseURL: string): OverlayManifestEntry[];
//# sourceMappingURL=manifest.d.ts.map