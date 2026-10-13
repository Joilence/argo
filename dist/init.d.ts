export declare function init(cwd?: string): Promise<void>;
export interface InitFromOptions {
    /** Path to the Playwright test file to convert. */
    from: string;
    /** Demo name override. Defaults to filename without extension. */
    demo?: string;
    /** Working directory. Defaults to process.cwd(). */
    cwd?: string;
}
/**
 * Convert an existing Playwright test into an Argo demo project.
 * Generates demo script (with fixture swap + mark() calls)
 * and a unified .scenes.json manifest (with _hint fields for LLM).
 */
export declare function initFrom(options: InitFromOptions): Promise<void>;
//# sourceMappingURL=init.d.ts.map