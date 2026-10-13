import type { CameraMove } from './camera-move.js';
/**
 * Subset of Playwright's Page we depend on — typed structurally so we don't
 * pull `@playwright/test` types into the runtime module.
 */
interface ScreencastPage {
    screencast: {
        start(options?: {
            path?: string;
            size?: {
                width: number;
                height: number;
            };
            quality?: number;
            onFrame?: (frame: {
                data: Buffer;
            }) => void | Promise<void>;
            annotate?: {
                duration?: number;
                position?: string;
                fontSize?: number;
            };
        }): Promise<unknown>;
        stop(): Promise<void>;
        showActions(options?: {
            duration?: number;
            fontSize?: number;
            position?: 'top-left' | 'top' | 'top-right' | 'bottom-left' | 'bottom' | 'bottom-right';
        }): Promise<unknown>;
    };
    evaluate<R>(pageFunction: () => R | Promise<R>): Promise<R>;
    on(event: 'framenavigated', listener: (frame: {
        parentFrame: () => unknown;
    }) => void): unknown;
    off(event: 'framenavigated', listener: (frame: {
        parentFrame: () => unknown;
    }) => void): unknown;
    context(): unknown;
}
export interface StartRecordingOptions {
    /** Override the recording size (defaults to the screencast page viewport). */
    size?: {
        width: number;
        height: number;
    };
    /** JPEG quality for the optional onFrame stream — passed straight through. */
    quality?: number;
}
export interface SceneDurationOptions {
    leadInMs?: number;
    leadOutMs?: number;
    minMs?: number;
    maxMs?: number;
    multiplier?: number;
    fallbackMs?: number;
}
export interface CursorSample {
    /** Normalized X position (0..1 of viewport width). */
    cx: number;
    /** Normalized Y position (0..1 of viewport height). */
    cy: number;
    /** Timestamp in ms from timeline start. */
    timeMs: number;
}
export declare class NarrationTimeline {
    private timings;
    private startTime;
    private sceneDurations;
    private cachedPlacements;
    private _cameraMoves;
    private _cursorTelemetry;
    private _fallbackWarned;
    private _screencastStop;
    private _streamCleanup;
    private _pendingThumbScene;
    private _recordingPage;
    private _navListener;
    private _cdpHandle;
    constructor(sceneDurations?: Record<string, number>);
    start(): void;
    /**
     * Begin screen recording via Playwright 1.59+ `page.screencast.start()`.
     * Call this once setup (login, navigation, theme prep) is done and the
     * "real" demo is about to begin. Re-anchors the timeline clock so the
     * next `mark()` lands at ~0ms — no head-trim heuristic needed downstream.
     *
     * No-op when ARGO_SCREENCAST_PATH is unset (e.g., running standalone in
     * VS Code without the argo pipeline). The fixture wires the env var.
     */
    /** True once `startRecording()` has been called and the screencast is
     *  active. Used by `renderComposition` to decide whether to start the
     *  recording itself (after a composition's warmup) or leave it alone
     *  when the demo started recording earlier for a recorded scene. */
    get isRecording(): boolean;
    startRecording(page: ScreencastPage, options?: StartRecordingOptions): Promise<void>;
    /**
     * Stop the active screencast, if any. Called by the test fixture in its
     * finally block. Swallows errors after warning — recording stop is
     * best-effort, the file is already on disk by the time we get here.
     */
    _closeRecording(): Promise<void>;
    /**
     * Mutate a no-op `data-argo-paint` attribute on the documentElement to
     * force Chrome's compositor to schedule a paint. CDP screencast then emits
     * a fresh frame containing the current visual state. Fire-and-forget — the
     * eval can race page disposal during teardown; we silently ignore those.
     */
    private _triggerPaint;
    mark(scene: string): void;
    /**
     * Record a camera move (zoom/pan) to be applied as an ffmpeg post-export effect.
     * Call this during recording with the target element's bounding box.
     */
    recordCameraMove(move: Omit<CameraMove, 'startMs'> & {
        startMs?: number;
    }): void;
    getCameraMoves(): CameraMove[];
    /**
     * Record a cursor position sample for dwell-based camera suggestions.
     * Coordinates should be normalized to 0..1 of the viewport.
     */
    recordCursorPosition(cx: number, cy: number): void;
    getCursorTelemetry(): CursorSample[];
    getTimings(): Record<string, number>;
    flush(outputPath: string): Promise<void>;
    private getBaseDuration;
    private getPlacements;
    /**
     * Compute a hold duration for a scene based on its TTS clip length.
     * Use for overlay durations and passive reading time — not for
     * page loads, click completion, or selector readiness.
     *
     * When the scene has already been marked, this returns the remaining wait
     * from "now", not the full scene duration. It also accounts for any audio
     * backlog caused by earlier clips running long.
     */
    durationFor(scene: string, options?: SceneDurationOptions): number;
    /**
     * Return the full scene duration based on TTS clip length — NOT time-aware.
     * Unlike `durationFor()` which subtracts elapsed time, this always returns
     * the same value regardless of when it's called. Use for overlay display
     * durations and anywhere you need a stable, non-decreasing value.
     */
    sceneDuration(scene: string, options?: SceneDurationOptions): number;
    /**
     * Return scene-relative per-word timestamps for `scene` (first word
     * starts near 0). Loaded from the transcript sidecar pointed to by
     * `ARGO_TRANSCRIPT_PATH` (the pipeline sets this to the scene-keyed
     * file after TTS+transcription). Empty array if transcription is
     * disabled or the file is missing — treat word timing as an
     * enhancement, not a precondition.
     *
     * Use this during recording to schedule effects on specific words:
     *
     *   for (const w of narration.wordTiming('hero')) {
     *     setTimeout(() => focusRing(page, '#x'), w.start * 1000);
     *   }
     *
     * For absolute (recording-aligned) timestamps over the whole video,
     * post-pipeline consumers should read `.argo/&lt;demo&gt;/narration.transcript.json`
     * directly — that file is written after alignment with placement
     * offsets folded in.
     */
    wordTiming(scene: string): WordTiming[];
    /**
     * Milliseconds from now until `target` is next spoken inside `scene`,
     * or null when the word is missing, already past, or the transcript
     * isn't loaded. Anchors come from the Whisper transcript, so spell
     * the word as Whisper transcribed it (Kokoro pronouncing "Kokoro" as
     * "cochro" means callers pass `'cochro'`, not `'Kokoro'`).
     */
    atWord(scene: string, target: string): number | null;
}
export interface WordTiming {
    text: string;
    start: number;
    end: number;
}
export {};
//# sourceMappingURL=narration.d.ts.map