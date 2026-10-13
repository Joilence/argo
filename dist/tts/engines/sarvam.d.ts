import type { TTSEngine, TTSEngineOptions, TTSEngineMetadata } from '../engine.js';
export interface SarvamEngineOptions {
    apiKey?: string;
    model?: string;
}
export declare class SarvamEngine implements TTSEngine {
    private apiKey;
    private model;
    constructor(options?: SarvamEngineOptions);
    private resolveApiKey;
    describe(): TTSEngineMetadata;
    generate(text: string, options: TTSEngineOptions): Promise<Buffer>;
}
//# sourceMappingURL=sarvam.d.ts.map