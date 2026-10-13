import { importOptional, ELEVENLABS_DEP } from '../../optional-deps.js';
export class ElevenLabsEngine {
    apiKey;
    model;
    stability;
    similarityBoost;
    constructor(options) {
        this.apiKey = options?.apiKey ?? '';
        this.model = options?.model ?? 'eleven_monolingual_v1';
        this.stability = options?.stability ?? 0.5;
        this.similarityBoost = options?.similarityBoost ?? 0.75;
    }
    resolveApiKey() {
        const key = this.apiKey || process.env.ELEVENLABS_API_KEY || '';
        if (!key) {
            throw new Error('ElevenLabs TTS engine requires an API key. ' +
                'Set ELEVENLABS_API_KEY environment variable or pass apiKey option.');
        }
        return key;
    }
    describe() {
        return { engine: 'elevenlabs', model: this.model };
    }
    async generate(text, options) {
        if (!text?.trim())
            throw new Error('TTS text must not be empty');
        // Loosely typed on purpose: the `convert()` call below uses snake_case
        // keys that the current SDK typings do not accept. Typing it would change
        // request shape, which is a behavioural fix, not a packaging one.
        const { ElevenLabsClient } = await importOptional(() => import('@elevenlabs/elevenlabs-js'), ELEVENLABS_DEP);
        const client = new ElevenLabsClient({ apiKey: this.resolveApiKey() });
        const audioStream = await client.textToSpeech.convert(options.voice ?? '21m00Tcm4TlvDq8ikWAM', // Rachel default
        {
            text,
            model_id: this.model,
            voice_settings: {
                stability: this.stability,
                similarity_boost: this.similarityBoost,
            },
        });
        // Collect stream into buffer
        const chunks = [];
        for await (const chunk of audioStream) {
            chunks.push(Buffer.from(chunk));
        }
        const mp3Buffer = Buffer.concat(chunks);
        // Convert MP3 to Argo WAV format. ElevenLabs has no speed parameter, so
        // the rate change rides along with the conversion.
        const { convertToWav } = await import('../engine.js');
        return convertToWav(mp3Buffer, options.speed ?? 1);
    }
}
//# sourceMappingURL=elevenlabs.js.map