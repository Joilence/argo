import type { TTSEngine, TTSEngineOptions, TTSEngineMetadata } from '../engine.js';
export interface MlxAudioEngineOptions {
    /** mlx-audio server URL. Default: http://localhost:8000 */
    baseUrl?: string;
    /** Model ID passed to the server. Default: mlx-community/Spark-TTS-0.5B-bf16 */
    model?: string;
    /** Path to a reference audio WAV file for voice cloning (requires a cloning-capable model). */
    refAudio?: string;
    /** Transcript of the reference audio (required when refAudio is set). */
    refText?: string;
    /** Instruction text for models that support instruct mode (e.g. emotion/style control). */
    instruct?: string;
    /** Gender hint. Default: "male". */
    gender?: string;
    /** Pitch multiplier. Default: 1.0. */
    pitch?: number;
    /** Language code. Default: "a". */
    langCode?: string;
    /** Sampling temperature. Default: 0.7. */
    temperature?: number;
    /** Top-p sampling. Default: 0.95. */
    topP?: number;
    /** Top-k sampling. Default: 40. */
    topK?: number;
    /** Repetition penalty. Default: 1.0. */
    repetitionPenalty?: number;
    /** Response audio format. Default: "mp3". */
    responseFormat?: string;
    /** Enable streaming response. Default: false. */
    stream?: boolean;
    /** Streaming chunk interval in seconds. Default: 2.0. */
    streamingInterval?: number;
    /** Max generation tokens. Default: 1200. */
    maxTokens?: number;
    /** Enable verbose server logging. Default: false. */
    verbose?: boolean;
}
export declare class MlxAudioEngine implements TTSEngine {
    private baseUrl;
    private model;
    private serverOptions;
    constructor(options?: MlxAudioEngineOptions);
    describe(): TTSEngineMetadata;
    generate(text: string, options: TTSEngineOptions): Promise<Buffer>;
}
//# sourceMappingURL=mlx-audio.d.ts.map