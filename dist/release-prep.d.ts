export interface ReleasePrepOptions {
    demoName: string;
    outputDir: string;
    demosDir: string;
    includeGif?: boolean;
    gifWidth?: number;
    gifFps?: number;
    version?: string;
}
export declare function releasePrep(options: ReleasePrepOptions): Promise<string>;
//# sourceMappingURL=release-prep.d.ts.map