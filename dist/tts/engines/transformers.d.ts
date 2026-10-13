import type { TTSEngine, TTSEngineOptions, TTSEngineMetadata } from '../engine.js';
export interface TransformersEngineOptions {
    /** Model ID from Hugging Face Hub. Default: 'onnx-community/Supertonic-TTS-ONNX' */
    model?: string;
    /** Quantization dtype. Default: 'q8' */
    dtype?: 'fp32' | 'fp16' | 'q8' | 'q4' | 'q4f16';
    /** Device for inference. Default: null (auto-detect) */
    device?: 'wasm' | 'webgpu' | 'cpu' | null;
    /** URL or path to speaker embedding .bin file for multi-speaker models. */
    speakerEmbeddings?: string;
    /** Number of inference steps (higher = better quality). Default: 10 */
    numInferenceSteps?: number;
    /** Default language code for models that require language tags (e.g., Supertonic-TTS-2 needs 'en'). Wraps text as `<lang>text</lang>`. */
    lang?: string;
}
export declare class TransformersEngine implements TTSEngine {
    private pipeline;
    private initPromise;
    private model;
    private dtype;
    private device;
    private speakerEmbeddings?;
    private numInferenceSteps;
    private lang?;
    constructor(options?: TransformersEngineOptions);
    describe(): TTSEngineMetadata;
    private getPipeline;
    generate(text: string, options: TTSEngineOptions): Promise<Buffer>;
}
//# sourceMappingURL=transformers.d.ts.map