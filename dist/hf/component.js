/**
 * Parse a hyperframes component snippet (HTML + <style> + optional <script>,
 * with usage notes in HTML comments) into injectable parts.
 *
 * Components are trusted-at-install (the user chose to `argo add` them and
 * the files are git-reviewable), but cue/script `params` are runtime input —
 * they are validated before being set as CSS custom properties.
 */
export function parseComponentSnippet(source) {
    const noComments = source.replace(/<!--[\s\S]*?-->/g, '');
    const css = [];
    const js = [];
    let rest = noComments.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_m, body) => {
        css.push(body.trim());
        return '';
    });
    rest = rest.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (_m, body) => {
        js.push(body.trim());
        return '';
    });
    return { html: rest.trim(), css: css.join('\n\n'), js: js.join('\n\n') };
}
/** CSS custom property name: --kebab-or-camel, nothing else. */
export function isSafeCssVarName(k) {
    return /^--[a-zA-Z][a-zA-Z0-9-]*$/.test(k);
}
/**
 * Conservative allowlist-by-rejection for CSS custom property VALUES.
 * Blocks declaration/block escapes and resource loads. Values are plain
 * lengths, colors, keywords, and simple functions like rgba()/calc().
 */
export function isSafeCssValue(v) {
    if (typeof v !== 'string' || v.length === 0 || v.length > 200)
        return false;
    if (/[;{}<>]/.test(v))
        return false;
    if (/url\s*\(|expression\s*\(|@import|javascript:/i.test(v))
        return false;
    // Reject raw control characters — never legitimate in a CSS value.
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x1f\x7f]/.test(v))
        return false;
    return true;
}
//# sourceMappingURL=component.js.map