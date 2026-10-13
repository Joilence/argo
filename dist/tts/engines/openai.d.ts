import type { TTSEngine, TTSEngineOptions, TTSEngineMetadata } from '../engine.js';
export interface OpenAIEngineOptions {
    apiKey?: string;
    /** TTS model: 'tts-1', 'tts-1-hd', 'gpt-4o-mini-tts', or any future model. */
    model?: string;
    /** System instructions for the model (supported by gpt-4o-mini-tts and newer). */
    instructions?: string;
}
export declare class OpenAIEngine implements TTSEngine {
    private apiKey;
    private model;
    private instructions?;
    constructor(options?: OpenAIEngineOptions);
    describe(): TTSEngineMetadata;
    private resolveApiKey;
    generate(text: string, options: TTSEngineOptions): Promise<Buffer>;
}
//# sourceMappingURL=openai.d.ts.map