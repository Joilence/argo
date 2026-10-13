export interface WordTiming {
    /** The word as Whisper transcribed it. Whisper emits leading spaces on
     *  most tokens; we strip those so consumers can join with their own
     *  separator. Trailing punctuation is preserved. */
    text: string;
    /** Start time relative to the input audio, in seconds. */
    start: number;
    /** End time relative to the input audio, in seconds. */
    end: number;
}
export interface TranscribeOptions {
    /** HuggingFace Hub model id. Default `Xenova/whisper-base.en` —
     *  ~140MB, ~5× realtime on Apple Silicon CPU, strong word-level accuracy
     *  on clean TTS audio. Use `whisper-tiny.en` for faster cold start at
     *  some accuracy cost, or `whisper-small.en` for tighter timestamps on
     *  difficult audio at half the throughput. */
    model?: string;
    /** Source language hint. Whisper auto-detects if omitted. Pass for
     *  multi-lingual TTS (e.g., Sarvam Indic clips). */
    language?: string;
}
export declare const DEFAULT_WHISPER_MODEL = "Xenova/whisper-base.en";
/** Transcribe a WAV file into word-level timestamps.
 *
 *  Whisper expects 16kHz mono Float32. Argo's TTS writes 24kHz mono Float32,
 *  and `transformers.js` in Node lacks `AudioContext` — so we shell out to
 *  ffmpeg (already a hard dep for export) to resample to 16kHz Float32 LE
 *  on stdout, then hand the raw samples to the pipeline. ~50ms overhead
 *  per clip; the model load (cold start) is the dominant cost.
 */
export declare function transcribeWav(wavPath: string, opts?: TranscribeOptions): Promise<WordTiming[]>;
/** Pre-warm the Whisper pipeline so the first `transcribeWav()` call
 *  pays the model-load cost up-front (the pipeline can then reuse the
 *  loaded model for all subsequent clips). Safe to call multiple times. */
export declare function warmTranscriber(model?: string): Promise<void>;
//# sourceMappingURL=transcribe.d.ts.map