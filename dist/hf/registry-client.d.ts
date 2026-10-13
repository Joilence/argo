/**
 * Minimal client for the hyperframes registry layout:
 *   <registryUrl>/registry.json
 *   <registryUrl>/<blocks|components>/<name>/registry-item.json
 *   <registryUrl>/<blocks|components>/<name>/<file.path>
 * Fetch is injectable so unit tests never touch the network.
 */
export declare const DEFAULT_REGISTRY_URL = "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry";
export type FetchLike = (url: string) => Promise<{
    ok: boolean;
    status: number;
    text(): Promise<string>;
    arrayBuffer(): Promise<ArrayBuffer>;
}>;
export interface RegistryIndexItem {
    name: string;
    type: string;
}
export interface RegistryItemFile {
    path: string;
    target?: string;
    type?: string;
    /**
     * Where the bytes live when they are not beside the manifest. Upstream hosts
     * binary assets on a CDN so the git registry stays text-only; for those
     * files nothing exists at the registry path.
     */
    url?: string;
}
/**
 * Resolve where an item file's bytes come from: its declared `url`, or the
 * registry path beside the manifest. Only an absolute `https://` url is
 * honoured; the manifest is third-party input, and anything else (`http:`,
 * `file:`, a bare host) is refused rather than guessed at. Throws before any
 * request is made, so a bad manifest fails before anything is written.
 */
export declare function itemFileSourceUrl(registryUrl: string, kind: 'blocks' | 'components', name: string, file: Pick<RegistryItemFile, 'path' | 'url'>): string;
export interface RegistryItem {
    name: string;
    type: string;
    title?: string;
    description?: string;
    tags?: string[];
    files: RegistryItemFile[];
    params?: Array<{
        key: string;
        label?: string;
        type?: string;
        default?: string;
    }>;
}
/** Registry item type → URL path segment. Examples are not installable. */
export declare function kindFromType(t: string): 'blocks' | 'components' | null;
export declare function fetchRegistryIndex(registryUrl: string, fetchImpl?: FetchLike): Promise<RegistryIndexItem[]>;
export declare function fetchRegistryItem(registryUrl: string, kind: 'blocks' | 'components', name: string, fetchImpl?: FetchLike): Promise<RegistryItem>;
/**
 * Fetch one item file as raw bytes. Items ship images, audio and fonts next to
 * their HTML, and decoding those as text replaces every invalid UTF-8 byte
 * with U+FFFD, so the install would succeed and leave the asset corrupt.
 */
export declare function fetchItemFile(registryUrl: string, kind: 'blocks' | 'components', name: string, file: Pick<RegistryItemFile, 'path' | 'url'>, fetchImpl?: FetchLike): Promise<Buffer>;
//# sourceMappingURL=registry-client.d.ts.map