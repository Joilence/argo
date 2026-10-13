/**
 * Minimal client for the hyperframes registry layout:
 *   <registryUrl>/registry.json
 *   <registryUrl>/<blocks|components>/<name>/registry-item.json
 *   <registryUrl>/<blocks|components>/<name>/<file.path>
 * Fetch is injectable so unit tests never touch the network.
 */
export const DEFAULT_REGISTRY_URL = 'https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry';
/** Largest single item file accepted, matching the hyperframes CLI's bound. */
const MAX_ITEM_FILE_BYTES = 128 * 1024 * 1024;
/**
 * Resolve where an item file's bytes come from: its declared `url`, or the
 * registry path beside the manifest. Only an absolute `https://` url is
 * honoured; the manifest is third-party input, and anything else (`http:`,
 * `file:`, a bare host) is refused rather than guessed at. Throws before any
 * request is made, so a bad manifest fails before anything is written.
 */
export function itemFileSourceUrl(registryUrl, kind, name, file) {
    if (file.url === undefined)
        return `${registryUrl}/${kind}/${name}/${file.path}`;
    let parsed;
    try {
        parsed = new URL(file.url);
    }
    catch {
        parsed = undefined;
    }
    if (!parsed || parsed.protocol !== 'https:') {
        throw new Error(`Unsafe file url "${file.url}" for "${name}/${file.path}": must be an absolute https:// URL.`);
    }
    return parsed.href;
}
/** Registry item type → URL path segment. Examples are not installable. */
export function kindFromType(t) {
    if (t === 'hyperframes:block')
        return 'blocks';
    if (t === 'hyperframes:component')
        return 'components';
    return null;
}
async function fetchText(url, fetchImpl) {
    const res = await fetchImpl(url);
    if (!res.ok) {
        throw new Error(`Registry fetch failed (${res.status}): ${url}`);
    }
    return res.text();
}
export async function fetchRegistryIndex(registryUrl, fetchImpl = fetch) {
    const url = `${registryUrl}/registry.json`;
    const raw = await fetchText(url, fetchImpl);
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        throw new Error(`Malformed JSON from registry at ${url} — got non-JSON response`);
    }
    if (!Array.isArray(parsed.items)) {
        throw new Error(`Malformed registry index: expected an "items" array at ${url}`);
    }
    return parsed.items;
}
export async function fetchRegistryItem(registryUrl, kind, name, fetchImpl = fetch) {
    const url = `${registryUrl}/${kind}/${name}/registry-item.json`;
    const raw = await fetchText(url, fetchImpl);
    let item;
    try {
        item = JSON.parse(raw);
    }
    catch {
        throw new Error(`Malformed JSON from registry at ${url} — got non-JSON response`);
    }
    if (!item.name || !Array.isArray(item.files)) {
        throw new Error(`Malformed registry-item.json for "${name}": missing name or files`);
    }
    return item;
}
/**
 * Fetch one item file as raw bytes. Items ship images, audio and fonts next to
 * their HTML, and decoding those as text replaces every invalid UTF-8 byte
 * with U+FFFD, so the install would succeed and leave the asset corrupt.
 */
export async function fetchItemFile(registryUrl, kind, name, file, fetchImpl = fetch) {
    const url = itemFileSourceUrl(registryUrl, kind, name, file);
    const res = await fetchImpl(url);
    if (!res.ok) {
        throw new Error(`Registry fetch failed (${res.status}): ${url}`);
    }
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > MAX_ITEM_FILE_BYTES) {
        throw new Error(`Registry file too large (${bytes.length} bytes): ${url}`);
    }
    return bytes;
}
//# sourceMappingURL=registry-client.js.map