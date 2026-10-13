/**
 * Parses a Playwright test/script and extracts logical scene boundaries
 * for converting into an Argo demo.
 */
export interface ParsedScene {
    /** Auto-generated scene name (kebab-case). */
    name: string;
    /** Lines of source code belonging to this scene. */
    lines: string[];
    /** Hint describing what happens in this scene (for LLM voiceover generation). */
    hint: string;
}
export interface ParsedPlaywrightTest {
    /** The test/function name found in the source. */
    testName: string;
    /** Detected scenes with their source lines and hints. */
    scenes: ParsedScene[];
    /** Original source lines (for reference). */
    sourceLines: string[];
    /** Imports found in the original file. */
    imports: string[];
}
/**
 * Parse a Playwright test file and extract scene boundaries.
 */
export declare function parsePlaywrightTest(source: string): ParsedPlaywrightTest;
/**
 * Generate an Argo demo script from a parsed Playwright test.
 */
export declare function generateDemoScript(parsed: ParsedPlaywrightTest): string;
/**
 * Generate a unified scenes skeleton from parsed scenes.
 * Combines voiceover text, hints, and overlay config into one manifest.
 */
export declare function generateScenesSkeleton(parsed: ParsedPlaywrightTest): Array<{
    scene: string;
    text: string;
    _hint: string;
    overlay: {
        type: string;
        text: string;
    };
}>;
/**
 * @deprecated Use generateScenesSkeleton instead.
 * Generate a skeleton voiceover manifest from parsed scenes.
 * Includes _hint fields for LLM-assisted text generation.
 */
export declare function generateVoiceoverSkeleton(parsed: ParsedPlaywrightTest): Array<{
    scene: string;
    text: string;
    _hint: string;
}>;
/**
 * @deprecated Use generateScenesSkeleton instead.
 * Generate a skeleton overlays manifest from parsed scenes.
 * Creates a lower-third for each scene as a starting point.
 */
export declare function generateOverlaysSkeleton(parsed: ParsedPlaywrightTest): Array<{
    scene: string;
    type: string;
    text: string;
}>;
//# sourceMappingURL=parse-playwright.d.ts.map