import { type FetchLike, type RegistryIndexItem } from './registry-client.js';
/**
 * Whether `name` is a plain registry item name, safe to `path.join` onto
 * `blocksDir`. Shared with the render path so an installed item and a manifest
 * reference are held to the same rule.
 */
export declare function isValidItemName(name: string): boolean;
export interface InstallResult {
    name: string;
    kind: 'blocks' | 'components';
    files: string[];
    targetDir: string;
}
export declare function listItems(opts: {
    registryUrl?: string;
    fetchImpl?: FetchLike;
}): Promise<RegistryIndexItem[]>;
export declare function installItem(opts: {
    name: string;
    blocksDir: string;
    registryUrl?: string;
    fetchImpl?: FetchLike;
}): Promise<InstallResult>;
//# sourceMappingURL=add.d.ts.map