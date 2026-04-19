import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileP = promisify(execFile);

/**
 * Content hash keying the shader render cache. Includes every input that can
 * affect output: shader source, timing parameters, resolution, and the content
 * of the two boundary frames.
 */
export function computeShaderHash(
  shader: string,
  durationMs: number,
  fps: number,
  width: number,
  height: number,
  aPngPath: string,
  bPngPath: string,
): string {
  const aHash = createHash('sha256').update(readFileSync(aPngPath)).digest('hex');
  const bHash = createHash('sha256').update(readFileSync(bPngPath)).digest('hex');
  const parts = [shader, durationMs, fps, width, height, aHash, bHash].join('|');
  return createHash('sha256').update(parts).digest('hex').slice(0, 16);
}

/**
 * Extract a single frame from a video at the given timestamp (seconds) using
 * ffmpeg. The output is a PNG at the source video's native resolution.
 *
 * Uses `-ss BEFORE -i` for seek acceptable for boundary-frame grabs
 * (one-frame precision not required — gl-transitions uses frozen frames).
 */
export async function extractBoundaryFrame(
  videoPath: string,
  timestampSec: number,
  outputPngPath: string,
): Promise<void> {
  const args = [
    '-ss', timestampSec.toFixed(3),
    '-i', videoPath,
    '-frames:v', '1',
    '-q:v', '1',
    '-y',
    outputPngPath,
  ];
  try {
    await execFileP('ffmpeg', args);
  } catch (err) {
    throw new Error(
      `Failed to extract boundary frame at ${timestampSec}s from ${videoPath}: ${(err as Error).message}`,
    );
  }
}
