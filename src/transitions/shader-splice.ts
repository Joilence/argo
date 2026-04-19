export interface ShaderBoundary {
  boundarySec: number;
  durationMs: number;
  /** ffmpeg input index for this boundary's PNG sequence (image2 demuxer). */
  extraInputIndex: number;
}

export interface ShaderSpliceOptions {
  totalDurationSec: number;
  boundaries: ShaderBoundary[];
  videoInputLabel: string;
  audioInputLabel: string | null;
  fps: number;
}

export interface ShaderSpliceResult {
  filterComplex: string;
  videoOutput: string;
  audioOutput: string | null;
}

/**
 * Splice shader PNG sequences into the scene concat at each boundary.
 *
 * Produces (2K+1) segments for K boundaries: scene_a_0 + trans_0 + scene_a_1 + trans_1 + ... + scene_a_K
 * Audio passes through at boundaries, trimmed to match.
 */
export function buildShaderSpliceFilter(opts: ShaderSpliceOptions): ShaderSpliceResult {
  const { totalDurationSec, boundaries, videoInputLabel, audioInputLabel } = opts;
  if (boundaries.length === 0) throw new Error('buildShaderSpliceFilter called with no boundaries');

  const parts: string[] = [];
  const videoLabels: string[] = [];
  const audioLabels: string[] = [];

  let cursorSec = 0;
  let activeBoundaries = 0;
  for (let i = 0; i < boundaries.length; i++) {
    const b = boundaries[i];
    const rawDHalf = b.durationMs / 2000;

    // Clamp dHalf so the transition window can't overlap the previous one
    // (cursorSec) or exceed the total video duration.
    const maxDHalfFromCursor = Math.max(0, b.boundarySec - cursorSec);
    const maxDHalfFromTotal = Math.max(0, opts.totalDurationSec - b.boundarySec);
    const dHalf = Math.min(rawDHalf, maxDHalfFromCursor, maxDHalfFromTotal);

    // If there's no room for the transition, skip this boundary entirely.
    // Downstream concat count and input indices adjust accordingly.
    if (dHalf <= 0) {
      // Warn once so users notice they configured overlapping transitions
      console.warn(
        `[shader-splice] skipping boundary at ${b.boundarySec.toFixed(2)}s — ` +
        `no room for ${b.durationMs}ms transition (too close to previous boundary or end of video)`,
      );
      continue;
    }

    // TODO: when dHalf is clamped smaller than rawDHalf, the PNG sequence was
    // rendered for the original duration but the splice slot is now shorter —
    // the PNG plays fewer frames before cutting to the next segment. A full fix
    // would regenerate PNG frames at the clamped duration.

    const sceneEnd = b.boundarySec - dHalf;
    const transitionEnd = b.boundarySec + dHalf;

    const vSceneLabel = `ssv${activeBoundaries}`;
    parts.push(
      `${videoInputLabel}trim=${cursorSec.toFixed(3)}:${sceneEnd.toFixed(3)},setpts=PTS-STARTPTS[${vSceneLabel}]`,
    );
    videoLabels.push(`[${vSceneLabel}]`);

    if (audioInputLabel) {
      const aSceneLabel = `ssa${activeBoundaries}`;
      parts.push(
        `${audioInputLabel}atrim=${cursorSec.toFixed(3)}:${sceneEnd.toFixed(3)},asetpts=PTS-STARTPTS[${aSceneLabel}]`,
      );
      audioLabels.push(`[${aSceneLabel}]`);
    }

    const vTransLabel = `stv${activeBoundaries}`;
    parts.push(`[${b.extraInputIndex}:v]setpts=PTS-STARTPTS[${vTransLabel}]`);
    videoLabels.push(`[${vTransLabel}]`);

    if (audioInputLabel) {
      const aTransLabel = `sta${activeBoundaries}`;
      parts.push(
        `${audioInputLabel}atrim=${sceneEnd.toFixed(3)}:${transitionEnd.toFixed(3)},asetpts=PTS-STARTPTS[${aTransLabel}]`,
      );
      audioLabels.push(`[${aTransLabel}]`);
    }

    cursorSec = transitionEnd;
    activeBoundaries++;
  }

  // Final scene segment
  const vLastLabel = `ssv${activeBoundaries}`;
  parts.push(
    `${videoInputLabel}trim=${cursorSec.toFixed(3)}:${totalDurationSec.toFixed(3)},setpts=PTS-STARTPTS[${vLastLabel}]`,
  );
  videoLabels.push(`[${vLastLabel}]`);
  if (audioInputLabel) {
    const aLastLabel = `ssa${activeBoundaries}`;
    parts.push(
      `${audioInputLabel}atrim=${cursorSec.toFixed(3)}:${totalDurationSec.toFixed(3)},asetpts=PTS-STARTPTS[${aLastLabel}]`,
    );
    audioLabels.push(`[${aLastLabel}]`);
  }

  const n = videoLabels.length;
  if (audioInputLabel) {
    const interleaved = videoLabels.map((v, i) => `${v}${audioLabels[i]}`).join('');
    parts.push(`${interleaved}concat=n=${n}:v=1:a=1[svout][saout]`);
    return { filterComplex: parts.join(';\n'), videoOutput: '[svout]', audioOutput: '[saout]' };
  }
  parts.push(`${videoLabels.join('')}concat=n=${n}:v=1:a=0[svout]`);
  return { filterComplex: parts.join(';\n'), videoOutput: '[svout]', audioOutput: null };
}
