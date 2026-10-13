/**
 * Waveform extraction for the preview server's timeline strip.
 *
 * Reads a WAV file, downsamples it to N peak buckets, and returns a normalized
 * `[0,1]` array suitable for canvas rendering. Cached per-process by file mtime
 * + bucket count so repeated requests during a preview session are cheap.
 */
export interface WaveformData {
    /** Normalized `[0,1]` peak amplitudes — one per bucket. */
    samples: number[];
    /** Total audio duration in ms. */
    durationMs: number;
    /** WAV sample rate in Hz. */
    sampleRate: number;
    /** Number of buckets (== samples.length). */
    bucketCount: number;
}
/** Compute waveform peaks from a WAV file. Returns null if the file is missing or unsupported. */
export declare function computeWaveform(wavPath: string, requestedBuckets?: number): WaveformData | null;
export declare function clearWaveformCache(path?: string): void;
//# sourceMappingURL=preview-waveform.d.ts.map