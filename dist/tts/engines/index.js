import { KokoroEngine } from './kokoro.js';
import { OpenAIEngine } from './openai.js';
import { ElevenLabsEngine } from './elevenlabs.js';
import { GeminiEngine } from './gemini.js';
import { SarvamEngine } from './sarvam.js';
import { MlxAudioEngine } from './mlx-audio.js';
import { TransformersEngine } from './transformers.js';
export const engines = {
    kokoro: (opts) => new KokoroEngine(opts),
    openai: (opts) => new OpenAIEngine(opts),
    elevenlabs: (opts) => new ElevenLabsEngine(opts),
    gemini: (opts) => new GeminiEngine(opts),
    sarvam: (opts) => new SarvamEngine(opts),
    mlxAudio: (opts) => new MlxAudioEngine(opts),
    transformers: (opts) => new TransformersEngine(opts),
};
export { KokoroEngine } from './kokoro.js';
export { OpenAIEngine } from './openai.js';
export { ElevenLabsEngine } from './elevenlabs.js';
export { GeminiEngine } from './gemini.js';
export { SarvamEngine } from './sarvam.js';
export { MlxAudioEngine } from './mlx-audio.js';
export { TransformersEngine } from './transformers.js';
//# sourceMappingURL=index.js.map