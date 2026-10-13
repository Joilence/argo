import { importOptional, GEMINI_DEP } from '../../optional-deps.js';
export class GeminiEngine {
    apiKey;
    model;
    constructor(options) {
        this.apiKey = options?.apiKey ?? '';
        // Must be a TTS model: the general ones answer an AUDIO request with 400,
        // "This model only supports text output". The `native-audio` models are no
        // use either, they speak only the Live API socket.
        this.model = options?.model ?? 'gemini-3.1-flash-tts-preview';
    }
    resolveApiKey() {
        const key = this.apiKey || process.env.GEMINI_API_KEY || '';
        if (!key) {
            throw new Error('Gemini TTS engine requires an API key. ' +
                'Set GEMINI_API_KEY environment variable or pass apiKey option.');
        }
        return key;
    }
    describe() {
        return { engine: 'gemini', model: this.model };
    }
    async generate(text, options) {
        if (!text?.trim())
            throw new Error('TTS text must not be empty');
        const { GoogleGenAI } = await importOptional(() => import('@google/genai'), GEMINI_DEP);
        const ai = new GoogleGenAI({ apiKey: this.resolveApiKey() });
        const response = await ai.models.generateContent({
            model: this.model,
            contents: [{ role: 'user', parts: [{ text: `Please read the following text aloud: ${text}` }] }],
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: options.voice ?? 'Kore',
                        },
                    },
                },
            },
        });
        // Gemini returns inline audio data as base64
        const audioPart = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.mimeType?.startsWith('audio/'));
        if (!audioPart?.inlineData?.data) {
            throw new Error('Gemini did not return audio data. Check model and voice configuration.');
        }
        const audioBuffer = Buffer.from(audioPart.inlineData.data, 'base64');
        // Convert to Argo WAV format. Gemini has no speed parameter, so the rate
        // change rides along with the conversion.
        const { convertToWav, parseRawAudioMime } = await import('../engine.js');
        const inputFormat = parseRawAudioMime(audioPart.inlineData.mimeType);
        return convertToWav(audioBuffer, options.speed ?? 1, inputFormat);
    }
}
//# sourceMappingURL=gemini.js.map