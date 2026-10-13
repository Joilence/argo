import type { TTSEngine, TTSEngineOptions, TTSEngineMetadata } from '../engine.js';
export interface GeminiEngineOptions {
    apiKey?: string;
    model?: string;
}
export declare class GeminiEngine implements TTSEngine {
    private apiKey;
    private model;
    constructor(options?: GeminiEngineOptions);
    private resolveApiKey;
    describe(): TTSEngineMetadata;
    generate(text: string, options: TTSEngineOptions): Promise<Buffer>;
}
//# sourceMappingURL=gemini.d.ts.map