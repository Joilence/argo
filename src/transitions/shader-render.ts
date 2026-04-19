import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

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
