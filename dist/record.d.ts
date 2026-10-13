import { type BrowserEngine, type ShowActionsConfig } from './config.js';
import type { CursorHighlightOptions } from './cursor.js';
export interface RecordOptions {
    demosDir: string;
    /** Directory containing installed hyperframes components (see `argo add`). */
    blocksDir?: string;
    baseURL: string;
    video: {
        width: number;
        height: number;
        fps?: number;
    };
    browser?: BrowserEngine;
    deviceScaleFactor?: number;
    isMobile?: boolean;
    hasTouch?: boolean;
    contextOptions?: Record<string, unknown>;
    autoBackground?: boolean;
    defaultPlacement?: string;
    allowRawGsap?: boolean;
    headed?: boolean;
    /** Override the .argo subdirectory name (for variants). Default: demoName. */
    argoSubdir?: string;
    /** Override the scene manifest. Default: `<demosDir>/<demoName>.scenes.json`.
     *  Set it for a language variant, whose overlays are translated too. */
    manifestPath?: string;
    /** Auto-annotate Playwright interactions in the recording. */
    showActions?: boolean | ShowActionsConfig;
    /** Render a pseudo-cursor highlight that follows mouse movement. */
    cursorHighlight?: boolean | CursorHighlightOptions;
    /** Capture a JPEG per scene mark for the preview scrubber. Default: true. */
    sceneThumbnails?: boolean;
    /** Capture all frames as JPEGs and stitch in post for higher quality. */
    captureMode?: 'webm' | 'jpeg-stitch';
    /** JPEG quality 0-100. Used by jpeg-stitch mode. */
    jpegQuality?: number;
    /** Playwright test retry count on failure. Default 0. */
    retries?: number;
    /** EXPERIMENTAL — pass `--enable-features=CanvasDrawElement` to chromium. */
    experimentalCanvasDrawElement?: boolean;
    /** Optional Playwright browser channel (chrome-canary, chrome-beta, ...). */
    browserChannel?: string;
    /** When true, pass `--allow-file-access-from-files` so file:// pages can
     * fetch sibling assets (relative GLTF/textures used by hyperframes
     * compositions). Toggled on automatically by renderComposition. */
    allowFileAccessFromFiles?: boolean;
}
export interface RecordResult {
    videoPath: string;
    timingPath: string;
}
export declare function record(demoName: string, options: RecordOptions): Promise<RecordResult>;
//# sourceMappingURL=record.d.ts.map