/**
 * TTS Engine interface and WAV utilities for Argo.
 */
export interface TTSEngineOptions {
    voice?: string;
    speed?: number;
    lang?: string;
}
export interface TTSEngineMetadata {
    engine: string;
    model?: string;
    instructions?: string;
    [key: string]: unknown;
}
export interface TTSEngine {
    generate(text: string, options: TTSEngineOptions): Promise<Buffer>;
    /** Return metadata about this engine for pipeline provenance tracking. */
    describe?(): TTSEngineMetadata;
}
/**
 * Split long text into chunks at sentence boundaries for better TTS quality.
 * Each chunk is between minChars and maxChars, split at sentence-ending punctuation.
 */
export declare function splitTextForTTS(text: string, { minChars, maxChars }?: {
    minChars?: number;
    maxChars?: number;
}): string[];
/**
 * Concatenate Float32Array audio chunks with optional silence gap between them.
 */
export declare function concatSamples(chunks: Float32Array[], sampleRate: number, gapMs?: number): Float32Array;
/**
 * Creates a valid WAV file buffer from Float32Array samples.
 * Format: mono, 32-bit IEEE float, given sample rate.
 */
export declare function createWavBuffer(samples: Float32Array, sampleRate?: number): Buffer;
export interface WavHeader {
    sampleRate: number;
    numChannels: number;
    bitsPerSample: number;
    audioFormat: number;
    dataSize: number;
    dataOffset: number;
    durationMs: number;
}
/**
 * Parses a WAV file header. Searches for the 'data' chunk rather than
 * assuming a fixed offset.
 */
export declare function parseWavHeader(wav: Buffer): WavHeader;
/**
 * Build the ffmpeg args that change playback rate to `speed`.
 *
 * `atempo` rather than `asetrate`: it resamples in the time domain, so the
 * voice speeds up without shifting pitch. Returns an empty array at 1x so the
 * default path spawns ffmpeg with no filter at all.
 */
export declare function buildAtempoChain(speed: number): string[];
/** A headerless audio stream. ffmpeg cannot sniff one, so it has to be told. */
export interface RawAudioFormat {
    /** ffmpeg demuxer name, passed to `-f`. `s16le` for signed 16-bit
     *  little-endian. Not a codec: `-c:a` would reject it. */
    format: string;
    sampleRate: number;
    channels: number;
}
/**
 * Read a raw-PCM media type into the arguments ffmpeg needs to open it.
 *
 * Raw PCM carries no header, so ffmpeg cannot open it without being told the
 * format. Gemini's TTS models send `audio/L16;codec=pcm;rate=24000`.
 *
 * Little-endian contradicts RFC 2586 section 3, which defines L16 as network
 * byte order, but it is what Google sends. A conforming provider needs `s16be`.
 *
 * Returns null for self-describing formats, which ffmpeg can probe itself.
 * Throws for an L16 type carrying no readable rate, which nothing can recover.
 */
export declare function parseRawAudioMime(mimeType: string | undefined): RawAudioFormat | null;
/**
 * Convert arbitrary audio (MP3, OGG, PCM, etc.) to Argo's WAV format
 * (mono, Float32, 24kHz) using ffmpeg.
 *
 * `speed` is applied here because engines that render server-side (ElevenLabs,
 * Gemini) have no native rate control — this conversion is the only place the
 * rate can change. Engines with their own speed parameter must not use it.
 *
 * `inputFormat` describes a headerless stream. Pass it whenever the source is
 * raw PCM; omit it and ffmpeg probes the container itself.
 */
export declare function convertToWav(audioBuffer: Buffer, speed?: number, inputFormat?: RawAudioFormat | null): Buffer;
/**
 * Creates a mock TTS engine that produces silent WAV buffers of the given
 * duration and records all calls for test assertions.
 */
export declare function createMockTTSEngine(durationMs?: number): TTSEngine & {
    calls: Array<{
        text: string;
        options: TTSEngineOptions;
    }>;
};
//# sourceMappingURL=engine.d.ts.map