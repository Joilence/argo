/**
 * TTS clip generation with manifest parsing and cache integration.
 */
import type { TTSEngine } from './engine.js';
import { type WordTiming } from './transcribe.js';
export interface TranscribeConfig {
    /** Whisper model id (HF Hub). Defaults to `onnx-community/whisper-base.en`. */
    model?: string;
    /** Optional language hint passed to Whisper. */
    language?: string;
}
export interface GenerateClipsOptions {
    manifestPath: string;
    demoName: string;
    /** Directory under `.argo/` holding this run's clips and transcripts.
     *  Defaults to `demoName`. Set it when one demo has several audio tracks,
     *  as language variants do, so one locale's clips cannot be served for
     *  another. */
    argoSubdir?: string;
    engine: TTSEngine;
    projectRoot: string;
    defaults?: {
        voice?: string;
        speed?: number;
    };
    /** Enable per-clip word-level transcription via Whisper. Off by default
     *  in v0.38.0 — opt in with `tts.transcribe: true` (or pass an object
     *  to override model/language). */
    transcribe?: boolean | TranscribeConfig;
}
export interface ClipResult {
    scene: string;
    clipPath: string;
    durationMs: number;
    /** Per-clip word timestamps (clip-relative). Only populated when
     *  transcription is enabled and succeeded; otherwise undefined. */
    wordTimings?: WordTiming[];
    /** Filesystem path of the cached transcript JSON, when written. */
    transcriptPath?: string;
}
export declare function generateClips(options: GenerateClipsOptions): Promise<ClipResult[]>;
//# sourceMappingURL=generate.d.ts.map