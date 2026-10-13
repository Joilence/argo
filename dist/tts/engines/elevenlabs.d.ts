import type { TTSEngine, TTSEngineOptions, TTSEngineMetadata } from '../engine.js';
export interface ElevenLabsEngineOptions {
    apiKey?: string;
    model?: string;
    stability?: number;
    similarityBoost?: number;
}
export declare class ElevenLabsEngine implements TTSEngine {
    private apiKey;
    private model;
    private stability;
    private similarityBoost;
    constructor(options?: ElevenLabsEngineOptions);
    private resolveApiKey;
    describe(): TTSEngineMetadata;
    generate(text: string, options: TTSEngineOptions): Promise<Buffer>;
}
//# sourceMappingURL=elevenlabs.d.ts.map