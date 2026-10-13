/**
 * Build ffmpeg inputs + filter_complex parts that composite pre-rendered
 * hyperframes block PNG sequences onto the video. Mirrors
 * buildOverlayPngFilters (src/overlays/render-to-png.ts) but for image2
 * sequences: the sequence starts at t=0, so setpts shifts it to the cue's
 * window before the enable-gated overlay. eof_action=pass keeps cutaway
 * semantics — output duration never changes.
 */
export interface RenderedHfBlock {
    name: string;
    pngDir: string;
    frameCount: number;
    fps: number;
    startMs: number;
    endMs: number;
    /** Native block canvas size (the PNG dimensions). */
    width: number;
    height: number;
    fit: 'cover' | {
        x: number;
        y: number;
        scale: number;
    };
}
export declare function buildHfBlockFilters(blocks: RenderedHfBlock[], baseInputCount: number, videoSourceLabel: string, videoW: number, videoH: number): {
    inputArgs: string[];
    filterParts: string[];
    videoSource: string;
    nextInput: number;
};
//# sourceMappingURL=block-filter.d.ts.map