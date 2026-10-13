import type { TTSEngine, TTSEngineOptions, TTSEngineMetadata } from '../engine.js';
export interface KokoroEngineOptions {
    modelId?: string;
    dtype?: 'fp32' | 'fp16' | 'q8' | 'q4' | 'q4f16';
    device?: 'wasm' | 'webgpu' | 'cpu' | null;
    onProgress?: (progress: {
        status: string;
        progress?: number;
        file?: string;
    }) => void;
}
export declare class KokoroEngine implements TTSEngine {
    private tts;
    private initPromise;
    private modelId;
    private dtype;
    private device;
    private onProgress?;
    constructor(options?: KokoroEngineOptions);
    describe(): TTSEngineMetadata;
    private getTTS;
    generate(text: string, options: TTSEngineOptions): Promise<Buffer>;
    stream(text: string, options: TTSEngineOptions): AsyncGenerator<{
        text: string;
        audio: Buffer;
    }>;
}
//# sourceMappingURL=kokoro.d.ts.map