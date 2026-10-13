/**
 * argo preview — browser-based replay viewer for iterating on voiceover,
 * overlays, and timing without re-recording.
 *
 * Serves a local web page that plays a seekable preview video (preferring MP4
 * over the raw Playwright WebM), overlays audio clips at scene timestamps,
 * renders overlay cues on a DOM layer, and lets the user edit voiceover text
 * + overlay props inline with per-scene TTS regen.
 */
export interface PreviewExportConfig {
    preset?: string;
    crf?: number;
    fps?: number;
    captureWidth?: number;
    captureHeight?: number;
    outputWidth?: number;
    outputHeight?: number;
    deviceScaleFactor?: number;
    thumbnailPath?: string;
    formats?: Array<'1:1' | '9:16' | 'gif'>;
    transition?: import('./config.js').TransitionConfig;
    speedRamp?: import('./config.js').SpeedRampConfig;
    loudnorm?: boolean;
    musicPath?: string;
    musicVolume?: number;
    watermark?: import('./config.js').WatermarkConfig;
    sharpen?: boolean | {
        strength: number;
    };
    frame?: import('./config.js').FrameConfig;
    motionBlur?: boolean | {
        intensity: number;
    };
    encoder?: 'cpu' | 'gpu';
    blocksDir?: string;
}
export interface PreviewOptions {
    demoName: string;
    argoDir?: string;
    demosDir?: string;
    outputDir?: string;
    port?: number;
    open?: boolean;
    ttsDefaults?: {
        voice?: string;
        speed?: number;
    };
    exportConfig?: PreviewExportConfig;
    regenerateTts?: (args: {
        manifestPath: string;
        scene: string;
    }) => Promise<void>;
}
export declare function startPreviewServer(options: PreviewOptions): Promise<{
    url: string;
    close: () => void;
}>;
//# sourceMappingURL=preview.d.ts.map