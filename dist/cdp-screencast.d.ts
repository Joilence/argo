/**
 * Structural subset of `BrowserContext.newCDPSession()` and the resulting
 * `CDPSession` we depend on. Avoids pulling `@playwright/test` types into
 * this module's runtime dependencies.
 */
interface CdpPage {
    context(): {
        newCDPSession(page: CdpPage): Promise<CdpSession>;
    };
}
interface CdpSession {
    on(event: 'Page.screencastFrame', listener: (payload: ScreencastFramePayload) => void): unknown;
    off(event: 'Page.screencastFrame', listener: (payload: ScreencastFramePayload) => void): unknown;
    send(method: 'Page.startScreencast', params: StartScreencastParams): Promise<unknown>;
    send(method: 'Page.stopScreencast'): Promise<unknown>;
    send(method: 'Page.screencastFrameAck', params: {
        sessionId: number;
    }): Promise<unknown>;
    detach(): Promise<unknown>;
}
interface ScreencastFramePayload {
    /** Base64-encoded JPEG. */
    data: string;
    metadata: {
        /** Frame swap timestamp in seconds since epoch (Network.TimeSinceEpoch). Optional in CDP, populated in chromium. */
        timestamp?: number;
        deviceWidth: number;
        deviceHeight: number;
    };
    sessionId: number;
}
interface StartScreencastParams {
    format?: 'jpeg' | 'png';
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    everyNthFrame?: number;
}
export interface CdpScreencastOptions {
    /** Final stitched mp4 output path. */
    outputPath: string;
    /** Capture size — passed to CDP as maxWidth/maxHeight. */
    size: {
        width: number;
        height: number;
    };
    /** JPEG quality 0-100. */
    quality: number;
    /** Output framerate hint for ffmpeg encode. Concat demuxer drives PTS from per-file durations; this is just metadata. */
    fps: number;
    /** Optional: write every captured JPEG to this path for live preview thumbnails. */
    liveFramePath?: string;
    /** Optional: per-scene thumb directory. Tag a scene via `setPendingThumb()`. */
    thumbsDir?: string;
}
export interface CdpScreencastHandle {
    /** Tag the next captured JPEG as the thumbnail for this scene. */
    setPendingThumb(scene: string): void;
    /**
     * Stop the screencast, flush remaining frames, run ffmpeg with concat
     * demuxer to produce `outputPath`, return when ffmpeg has exited.
     */
    stop(): Promise<void>;
    /** Number of frames CDP delivered (excludes any synthesized padding). */
    frameCount(): number;
}
/**
 * Build concat-demuxer lines from an ordered list of frames with paint
 * timestamps. Exported for tests.
 *
 * The concat demuxer reads:
 *   file 'frame-0000000.jpg'
 *   duration 0.0333
 *   file 'frame-0000001.jpg'
 *   duration 0.0286
 *   ...
 *   file 'frame-NNNNNNN.jpg'  ← final entry repeated, see below
 *
 * Each `duration` applies to the file that PRECEDES it. The final file's
 * duration is given by the trailing entry — and concat requires the last
 * file line to be repeated AFTER its duration so the duration is applied
 * (otherwise ffmpeg uses the file's intrinsic duration, which for a JPEG
 * is "1 frame at 25fps" = 40ms).
 */
export declare function buildConcatLines(frames: ReadonlyArray<{
    filename: string;
    paintTimestampSec: number;
}>, fallbackFps: number): string[];
/**
 * Begin a CDP-direct screencast. Bypasses Playwright's `page.screencast.start`
 * so we own the `Page.screencastFrame` events end-to-end. Each event carries
 * `metadata.timestamp` — the actual paint time on Chrome's clock — which lets
 * us timestamp frames by paint, not by Node-side arrival wallclock. This is
 * the only way to keep visuals aligned with audio when CDP transport can't
 * sustain wallclock pace at high resolutions.
 *
 * Frames are written to disk under `<outputDir>/cdp-frames/`, then stitched
 * into the final mp4 via ffmpeg's concat demuxer with per-frame durations
 * derived from paint-timestamp deltas. Disk buffering trades ~5MB/s of I/O
 * for VFR output that doesn't depend on wallclock at all.
 *
 * Caller MUST NOT also call `page.screencast.start()` — Chromium accepts only
 * one screencast subscriber per target; the second supersedes the first.
 * `page.screencast.showActions()` is independent and stays usable.
 */
export declare function startCdpScreencast(page: CdpPage, options: CdpScreencastOptions): Promise<CdpScreencastHandle>;
export {};
//# sourceMappingURL=cdp-screencast.d.ts.map