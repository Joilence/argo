/**
 * Parse a hyperframes component snippet (HTML + <style> + optional <script>,
 * with usage notes in HTML comments) into injectable parts.
 *
 * Components are trusted-at-install (the user chose to `argo add` them and
 * the files are git-reviewable), but cue/script `params` are runtime input —
 * they are validated before being set as CSS custom properties.
 */
export interface ComponentSnippet {
    html: string;
    css: string;
    js: string;
}
export declare function parseComponentSnippet(source: string): ComponentSnippet;
/** CSS custom property name: --kebab-or-camel, nothing else. */
export declare function isSafeCssVarName(k: string): boolean;
/**
 * Conservative allowlist-by-rejection for CSS custom property VALUES.
 * Blocks declaration/block escapes and resource loads. Values are plain
 * lengths, colors, keywords, and simple functions like rgba()/calc().
 */
export declare function isSafeCssValue(v: string): boolean;
//# sourceMappingURL=component.d.ts.map