import { splitTextForTTS, concatSamples } from '../engine.js';
import { importOptional, KOKORO_DEP } from '../../optional-deps.js';
export class KokoroEngine {
    tts = null;
    initPromise = null;
    modelId;
    dtype;
    device;
    onProgress;
    constructor(options) {
        this.modelId = options?.modelId ?? 'onnx-community/Kokoro-82M-v1.0-ONNX';
        this.dtype = options?.dtype ?? 'q8';
        this.device = options?.device ?? null;
        this.onProgress = options?.onProgress;
    }
    describe() {
        return { engine: 'kokoro', model: this.modelId, dtype: this.dtype };
    }
    async getTTS() {
        if (this.tts)
            return this.tts;
        if (!this.initPromise) {
            this.initPromise = (async () => {
                // Resolve the package first so a missing optional dependency reports
                // the install command instead of being reported as a failed download.
                const { KokoroTTS } = await importOptional(() => import('kokoro-js'), KOKORO_DEP).catch((err) => {
                    this.initPromise = null;
                    throw err;
                });
                try {
                    this.tts = await KokoroTTS.from_pretrained(this.modelId, {
                        dtype: this.dtype,
                        device: this.device,
                        progress_callback: this.onProgress ?? undefined,
                    });
                }
                catch (err) {
                    this.initPromise = null;
                    throw new Error(`Failed to initialize Kokoro TTS (model: ${this.modelId}, dtype: ${this.dtype}). ` +
                        `This may require an internet connection for first-time model download. ` +
                        `Original error: ${err.message}`);
                }
                return this.tts;
            })();
        }
        return this.initPromise;
    }
    async generate(text, options) {
        if (!text?.trim())
            throw new Error('TTS text must not be empty');
        const tts = await this.getTTS();
        const { createWavBuffer } = await import('../engine.js');
        const chunks = splitTextForTTS(text);
        const audioChunks = [];
        let sampleRate = 24000;
        for (const chunk of chunks) {
            let audio;
            try {
                audio = await tts.generate(chunk, {
                    voice: options.voice ?? 'af_heart',
                    speed: options.speed ?? 1.0,
                });
            }
            catch (err) {
                throw new Error(`Kokoro TTS failed to generate audio for text "${chunk.substring(0, 80)}..." ` +
                    `(voice: ${options.voice ?? 'af_heart'}). Original error: ${err.message}`);
            }
            const samples = audio.data ?? audio.audio;
            if (!samples || !(samples instanceof Float32Array)) {
                throw new Error('kokoro-js returned unexpected audio format. Check kokoro-js version.');
            }
            sampleRate = audio.sampling_rate;
            audioChunks.push(samples);
        }
        return createWavBuffer(concatSamples(audioChunks, sampleRate), sampleRate);
    }
    async *stream(text, options) {
        if (!text?.trim())
            throw new Error('TTS text must not be empty');
        const tts = await this.getTTS();
        const { createWavBuffer } = await import('../engine.js');
        for await (const chunk of tts.stream(text, {
            voice: options.voice ?? 'af_heart',
            speed: options.speed ?? 1.0,
        })) {
            const samples = chunk.audio.data ?? chunk.audio.audio;
            const sampleRate = chunk.audio.sampling_rate;
            yield { text: chunk.text, audio: createWavBuffer(samples, sampleRate) };
        }
    }
}
//# sourceMappingURL=kokoro.js.map