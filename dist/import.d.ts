export interface ImportOptions {
    videoPath: string;
    demo?: string;
    /** Directory for scenes manifests. Default: 'demos'. */
    demosDir?: string;
    cwd?: string;
    /** Overwrite existing scaffold files (.scenes.json, .timing.json). */
    force?: boolean;
}
export interface ImportResult {
    demoName: string;
    demoDir: string;
    durationMs: number;
    /** Video dimensions probed from the source file. */
    dimensions?: {
        width: number;
        height: number;
    };
}
export declare function importVideo(options: ImportOptions): Promise<ImportResult>;
//# sourceMappingURL=import.d.ts.map