import { importOptional, OPENAI_DEP } from '../../optional-deps.js';
export class OpenAIEngine {
    apiKey;
    model;
    instructions;
    constructor(options) {
        this.apiKey = options?.apiKey ?? '';
        this.model = options?.model ?? 'tts-1';
        this.instructions = options?.instructions;
    }
    describe() {
        const meta = { engine: 'openai', model: this.model };
        if (this.instructions)
            meta.instructions = this.instructions;
        return meta;
    }
    resolveApiKey() {
        const key = this.apiKey || process.env.OPENAI_API_KEY || '';
        if (!key) {
            throw new Error('OpenAI TTS engine requires an API key. ' +
                'Set OPENAI_API_KEY environment variable or pass apiKey option.');
        }
        return key;
    }
    async generate(text, options) {
        if (!text?.trim())
            throw new Error('TTS text must not be empty');
        const { OpenAI } = await importOptional(() => import('openai'), OPENAI_DEP);
        const client = new OpenAI({ apiKey: this.resolveApiKey() });
        // Request raw PCM so we can build an exact WAV without ffmpeg pipe artifacts
        const params = {
            model: this.model,
            voice: options.voice ?? 'alloy',
            input: text,
            speed: options.speed ?? 1.0,
            response_format: 'pcm',
        };
        if (this.instructions)
            params.instructions = this.instructions;
        const response = await client.audio.speech.create(params);
        const arrayBuffer = await response.arrayBuffer();
        const pcmBuffer = Buffer.from(arrayBuffer);
        // OpenAI PCM format: 24kHz, 16-bit signed LE, mono
        // Convert 16-bit PCM samples to Float32 and build WAV directly
        const sampleRate = 24000;
        const sampleCount = pcmBuffer.length / 2;
        const samples = new Float32Array(sampleCount);
        for (let i = 0; i < sampleCount; i++) {
            samples[i] = pcmBuffer.readInt16LE(i * 2) / 32768;
        }
        const { createWavBuffer } = await import('../engine.js');
        return createWavBuffer(samples, sampleRate);
    }
}
//# sourceMappingURL=openai.js.map