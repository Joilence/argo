import type { Placement } from './tts/align.js';
import type { TransitionConfig, WatermarkConfig, FrameConfig } from './config.js';
import { type Segment } from './speed-ramp.js';
import { type CameraMove } from './camera-move.js';
import { type ResolvedFreeze } from './freeze.js';
import { type RenderedOverlayPng } from './overlays/render-to-png.js';
import { type RenderedHfBlock } from './hf/block-filter.js';
export interface ExportOptions {
    demoName: string;
    /** Basename for the written artifacts. Defaults to `demoName`.
     *  Set it when the run's `.argo` directory and its output file need
     *  different names, as a language variant does: it reads
     *  `.argo/<demo>-<lang>/` and writes `<demo>.<lang>.mp4`. */
    outputName?: string;
    argoDir: string;
    outputDir: string;
    preset?: string;
    crf?: number;
    fps?: number;
    /** Trim this many ms from the start of the video (skip setup before first scene). */
    headTrimMs?: number;
    tailPadMs?: number;
    /** Logical output width (e.g. 1920). Used with deviceScaleFactor for downscaling. */
    outputWidth?: number;
    /** Logical output height (e.g. 1080). Used with deviceScaleFactor for downscaling. */
    outputHeight?: number;
    /** When > 1, recording was captured at scaled resolution and needs lanczos downscale. */
    deviceScaleFactor?: number;
    /** Optional path to a PNG image to embed as the MP4 thumbnail (cover art). */
    thumbnailPath?: string;
    /** Optional path to ffmpeg chapter metadata file for MP4 chapter markers. */
    chapterMetadataPath?: string;
    /** Additional formats to export alongside the main 16:9. */
    formats?: Array<'1:1' | '9:16' | 'gif'>;
    /** Scene transition config for inter-scene transitions. */
    transition?: TransitionConfig;
    /** Scene placements — needed for transitions. */
    placements?: Placement[];
    /** Estimated total duration in ms — used for progress bar. */
    totalDurationMs?: number;
    /** Precomputed speed-ramp segments on the post-trim timeline. */
    speedRampSegments?: Segment[];
    /** Apply EBU R128 loudness normalization to audio. */
    loudnorm?: boolean;
    /** Path to a background music file to mix under narration. */
    musicPath?: string;
    /** Music volume level (0.0 to 1.0). Default: 0.15. Mixed at a constant level. */
    musicVolume?: number;
    /** Extra audio tracks (typically from hyperframes compositions whose
     * `<audio>` elements aren't captured by CDP screencast). Each track is
     * delayed to its `startMs`, volume-scaled, and amix'd with the narration. */
    extraAudioTracks?: Array<{
        src: string;
        startMs: number;
        volume?: number;
    }>;
    /** Post-export camera moves (zoom/pan) recorded during Playwright session. */
    cameraMoves?: CameraMove[];
    /** Resolved freeze-frame holds — applied BEFORE transitions (they change the timeline). */
    freezeSpecs?: ResolvedFreeze[];
    /** Watermark/brand bug overlay config. */
    watermark?: WatermarkConfig;
    /** Pre-rendered overlay PNGs to composite onto the video (for imported videos). */
    overlayPngs?: RenderedOverlayPng[];
    /** Pre-rendered hyperframes block PNG sequences composited as cutaway overlays. */
    hfBlocks?: RenderedHfBlock[];
    /** Apply contrast-adaptive sharpening (CAS) to restore text crispness.
     * true = strength 0.5. { strength: 0.0-1.0 } to tune. */
    sharpen?: boolean | {
        strength: number;
    };
    /** Frame the recording with padding, rounded corners, drop shadow, and background. */
    frame?: FrameConfig;
    /** Path to a pre-rendered frame PNG (from generateFramePng). Speeds up encoding. */
    framePngPath?: string;
    /** Apply motion blur during camera move transitions.
     * true = intensity 0.5. { intensity: 0.0-1.0 } to tune. */
    motionBlur?: boolean | {
        intensity: number;
    };
    /** Pre-rendered shader transitions — paths to PNG sequence dirs per boundary. */
    shaderTransitions?: Array<{
        boundarySec: number;
        durationMs: number;
        pngDir: string;
        frameCount: number;
    }>;
    /** Encoder preference for the final mux step. `'cpu'` → libx264 (slower,
     * cleaner dark regions); `'gpu'` → platform GPU encoder (faster, more
     * banding on videotoolbox). When unset, the caller's default applies
     * (pipeline/cli pass 'cpu'; preview re-export passes 'gpu'). The
     * `ARGO_USE_GPU` env var still wins as an override. */
    encoder?: 'cpu' | 'gpu';
    /** Default encoder preference if `encoder` is unset. Set by callers. */
    encoderDefault?: 'cpu' | 'gpu';
}
/**
 * Check whether ffmpeg is available on the system PATH.
 * Returns true if found, throws with install instructions otherwise.
 */
export declare function checkFfmpeg(): boolean;
/**
 * Export a demo to MP4 by combining the screen recording with aligned narration audio.
 */
export declare function exportVideo(options: ExportOptions): Promise<string>;
//# sourceMappingURL=export.d.ts.map