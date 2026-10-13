export interface ClipOptions {
    demoName: string;
    scene: string;
    outputDir: string;
    format?: 'mp4' | 'gif';
    /** GIF width in pixels (default: 640) */
    gifWidth?: number;
    /** GIF framerate (default: 10) */
    gifFps?: number;
}
export declare function extractClip(options: ClipOptions): Promise<string>;
//# sourceMappingURL=clip.d.ts.map