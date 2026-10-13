import { type ArgoConfig } from './config.js';
export interface PipelineOptions {
    headed?: boolean;
    /** Override `video.retries` for this run. */
    retries?: number;
    /** Narrate this run from `<demosDir>/locales/<demo>.<lang>.scenes.json`
     *  instead of the base manifest, and keep its clips, timings and video in
     *  `.argo/<demo>-<lang>/`.
     *
     *  Unlike `export.variants`, which re-record one TTS pass at several
     *  viewports, a language variant cannot share anything: its scenes are a
     *  different length, so the browser is held for different durations and the
     *  recording itself differs. */
    lang?: string;
}
/**
 * Discover all demo names in the demos directory by looking for `.scenes.json` files.
 */
export declare function discoverDemos(demosDir: string): string[];
/**
 * Run the pipeline for all demos in the demosDir.
 */
export declare function runBatchPipeline(config: Pick<ArgoConfig, 'baseURL' | 'demosDir' | 'blocksDir' | 'outputDir' | 'tts' | 'video' | 'export' | 'overlays'>, pipelineOpts?: PipelineOptions): Promise<string[]>;
export declare function runPipeline(demoName: string, config: Pick<ArgoConfig, 'baseURL' | 'demosDir' | 'blocksDir' | 'outputDir' | 'tts' | 'video' | 'export' | 'overlays'>, pipelineOpts?: PipelineOptions): Promise<string>;
//# sourceMappingURL=pipeline.d.ts.map