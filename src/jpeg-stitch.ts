import { execFile } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

interface FrameLogEntry {
  idx: number;
  ms: number;
  bytes: number;
}

export interface StitchOptions {
  /** Directory containing NNNNNN.jpg + frames.jsonl (from narration.startRecording with ARGO_FRAMES_DIR set). */
  framesDir: string;
  /** Output WebM/MP4 path. Extension drives the container; codec is libx264 for .mp4, libvpx-vp9 for .webm. */
  outputPath: string;
  /** Target frame rate. The stitcher uses an ffconcat list to honor the actual per-frame timestamps,
   *  so this is mostly informational — but it sets the output stream's nominal rate. Default: 30. */
  fps?: number;
  /** x264 CRF for the intermediate. Lower = higher quality. Default: 12 (near-lossless).
   * The intermediate is re-encoded by the export step, so we keep this very high
   * so the final encode sees the JPEG source quality unaltered. */
  crf?: number;
  /** x264 preset. Default: 'slow'. */
  preset?: string;
}

export interface StitchResult {
  outputPath: string;
  frameCount: number;
  /** Total recording duration derived from the last frame's timestamp, in seconds. */
  durationSec: number;
  /** Total bytes of the JPEG intermediate (informational — for cleanup decisions). */
  intermediateBytes: number;
}

/**
 * Stitch a directory of sequenced JPEG frames into a video using ffmpeg's
 * ffconcat demuxer so per-frame durations are accurate (no fixed-fps assumption).
 */
export async function stitchJpegFrames(opts: StitchOptions): Promise<StitchResult> {
  const { framesDir, outputPath } = opts;
  const fps = opts.fps ?? 30;
  const crf = opts.crf ?? 12;
  const preset = opts.preset ?? 'slow';

  const logPath = join(framesDir, 'frames.jsonl');
  if (!existsSync(logPath)) {
    throw new Error(`No frames.jsonl in ${framesDir} — was the demo recorded with captureMode: 'jpeg-stitch'?`);
  }

  const lines = readFileSync(logPath, 'utf-8').split('\n').filter(Boolean);
  if (lines.length === 0) {
    throw new Error(`frames.jsonl in ${framesDir} is empty — onFrame never fired during recording.`);
  }

  const entries: FrameLogEntry[] = lines.map((line, i) => {
    try {
      return JSON.parse(line) as FrameLogEntry;
    } catch (err) {
      throw new Error(`Invalid frames.jsonl line ${i + 1}: ${(err as Error).message}`);
    }
  });

  // Sanity-check frames are present on disk. Skip missing entries (best-effort
  // robustness if a write race dropped the JPEG but logged the metadata).
  const validEntries: FrameLogEntry[] = [];
  let intermediateBytes = 0;
  for (const e of entries) {
    const seq = String(e.idx).padStart(6, '0');
    const framePath = join(framesDir, `${seq}.jpg`);
    if (existsSync(framePath)) {
      validEntries.push(e);
      intermediateBytes += e.bytes;
    }
  }
  if (validEntries.length === 0) {
    throw new Error(`No JPEG frames found in ${framesDir} despite ${entries.length} log entries.`);
  }

  // Build the ffconcat list. Each entry: file path + duration to next frame
  // (in seconds). The last frame's duration repeats the previous interval.
  const lines2: string[] = ['ffconcat version 1.0'];
  for (let i = 0; i < validEntries.length; i++) {
    const e = validEntries[i];
    const next = validEntries[i + 1];
    const seq = String(e.idx).padStart(6, '0');
    lines2.push(`file '${seq}.jpg'`);
    if (next) {
      const durSec = Math.max(0.001, (next.ms - e.ms) / 1000);
      lines2.push(`duration ${durSec.toFixed(6)}`);
    } else {
      // Last frame — pad with ~1/fps duration so it doesn't get truncated.
      lines2.push(`duration ${(1 / fps).toFixed(6)}`);
    }
  }
  // ffconcat quirk: the last `file` directive must be repeated without a
  // duration, otherwise the final frame is dropped from the output.
  const lastSeq = String(validEntries[validEntries.length - 1].idx).padStart(6, '0');
  lines2.push(`file '${lastSeq}.jpg'`);

  const concatPath = join(framesDir, '.concat.txt');
  writeFileSync(concatPath, lines2.join('\n'), 'utf-8');

  // The stitcher always produces a near-lossless H.264 intermediate (CRF 12),
  // regardless of the output filename's extension. The export step will
  // re-encode to the user-configured CRF — keeping the intermediate visually
  // transparent ensures the JPEG source quality survives that final step.
  const args = [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', concatPath,
    '-c:v', 'libx264',
    '-preset', preset,
    '-crf', String(crf),
    '-pix_fmt', 'yuv420p',
    '-r', String(fps),
    '-colorspace', 'bt709',
    '-color_primaries', 'bt709',
    '-color_trc', 'bt709',
    '-color_range', 'tv',
    '-vf', 'scale=in_range=pc:out_range=tv',
    outputPath,
  ];

  await execFileAsync('ffmpeg', args, { maxBuffer: 64 * 1024 * 1024 });

  const lastEntry = validEntries[validEntries.length - 1];
  const durationSec = lastEntry.ms / 1000;

  return {
    outputPath,
    frameCount: validEntries.length,
    durationSec,
    intermediateBytes,
  };
}

/** List all frames matching NNNNNN.jpg in framesDir (sorted by sequence number). */
export function listFrames(framesDir: string): string[] {
  if (!existsSync(framesDir)) return [];
  return readdirSync(framesDir)
    .filter(f => /^\d{6}\.jpg$/.test(f))
    .sort();
}
