import { join } from 'node:path';
export function buildHfBlockFilters(blocks, baseInputCount, videoSourceLabel, videoW, videoH) {
    if (blocks.length === 0) {
        return { inputArgs: [], filterParts: [], videoSource: videoSourceLabel, nextInput: baseInputCount };
    }
    const inputArgs = [];
    const filterParts = [];
    let currentVideo = videoSourceLabel;
    let nextInput = baseInputCount;
    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        const inputIdx = nextInput++;
        inputArgs.push('-framerate', String(b.fps), '-start_number', '0', '-i', join(b.pngDir, 'frame_%04d.png'));
        const startSec = (b.startMs / 1000).toFixed(3);
        const endSec = (b.endMs / 1000).toFixed(3);
        let scaleExpr;
        let x;
        let y;
        if (b.fit === 'cover') {
            // Fill the frame keeping the block's aspect ratio, then centre-crop the
            // overflow. A bare scale=W:H stretches: a 16:9 block in a 9:16 variant
            // would be squashed to a third of its width. When the aspects already
            // match, the crop is a no-op.
            scaleExpr = `scale=${videoW}:${videoH}:force_original_aspect_ratio=increase,crop=${videoW}:${videoH}`;
            x = 0;
            y = 0;
        }
        else {
            scaleExpr = `scale=${Math.round(b.width * b.fit.scale)}:${Math.round(b.height * b.fit.scale)}`;
            x = b.fit.x;
            y = b.fit.y;
        }
        const prepLabel = `hfblk${i}`;
        const outLabel = `hfb${i}`;
        filterParts.push(`[${inputIdx}:v]format=rgba,${scaleExpr},setpts=PTS+${startSec}/TB[${prepLabel}]`);
        filterParts.push(`[${currentVideo}][${prepLabel}]overlay=${x}:${y}:enable='between(t\\,${startSec}\\,${endSec})':format=auto:eof_action=pass[${outLabel}]`);
        currentVideo = outLabel;
    }
    return { inputArgs, filterParts, videoSource: currentVideo, nextInput };
}
//# sourceMappingURL=block-filter.js.map