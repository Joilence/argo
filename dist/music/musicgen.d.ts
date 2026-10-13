/**
 * AI-generated background music via MusicGen (Transformers.js).
 * Uses Xenova/musicgen-small (~1.8GB ONNX model, downloaded on first run).
 */
export interface MusicGenOptions {
    /** Text prompt describing the desired music (e.g., "lofi chill ambient with soft piano"). */
    prompt: string;
    /** Duration in seconds for generated music. Default: 30. */
    durationSec?: number;
    /** Classifier-free guidance scale. Higher = more prompt-adherent. Default: 3. */
    guidanceScale?: number;
    /** Sampling temperature. Default: 1.0. */
    temperature?: number;
}
/**
 * Compute a content-addressed cache key from all generation parameters.
 */
export declare function computeCacheKey(options: MusicGenOptions): string;
/**
 * Returns the cache file path for a given demo + options.
 */
export declare function getCachePath(argoDir: string, options: MusicGenOptions): string;
/**
 * Check if a cached music file exists for the given options.
 */
export declare function isCached(argoDir: string, options: MusicGenOptions): boolean;
/**
 * Generate background music from a text prompt using MusicGen.
 *
 * The model (~1.8GB) is downloaded on first run. Generation takes ~30-60s
 * depending on duration and hardware.
 *
 * Returns a WAV buffer (Float32, mono, 32kHz — ffmpeg handles resampling during export).
 */
export declare function generateMusic(options: MusicGenOptions): Promise<Buffer>;
/**
 * Generate music with caching. Returns the path to the WAV file.
 *
 * If a cached file exists for the same prompt + parameters, skips generation.
 * On model load or generation failure, warns and returns null (best-effort).
 */
export declare function generateMusicCached(argoDir: string, options: MusicGenOptions): Promise<string | null>;
//# sourceMappingURL=musicgen.d.ts.map