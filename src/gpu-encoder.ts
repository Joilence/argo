import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileP = promisify(execFile);

export type GpuEncoder = 'nvenc' | 'videotoolbox' | 'vaapi' | 'qsv' | null;

let cached: GpuEncoder | undefined;

/**
 * Probe ffmpeg for a GPU-accelerated H.264 encoder.
 *
 * Detection order (preference): nvenc > videotoolbox > vaapi > qsv.
 * Returns `null` if no GPU encoder is available — caller should fall back
 * to libx264.
 *
 * Result is cached for the process lifetime. Call `resetGpuEncoderCache()`
 * in tests if you need to re-probe.
 */
export async function detectGpuEncoder(): Promise<GpuEncoder> {
  if (cached !== undefined) return cached;
  const result = await probeEncoders();
  if (result !== null) cached = result;
  return result;
}

export function resetGpuEncoderCache(): void {
  cached = undefined;
}

async function probeEncoders(): Promise<GpuEncoder> {
  try {
    const { stdout } = await execFileP('ffmpeg', ['-encoders'], { maxBuffer: 2 * 1024 * 1024 });
    if (stdout.includes('h264_nvenc')) return 'nvenc';
    if (stdout.includes('h264_videotoolbox')) return 'videotoolbox';
    if (stdout.includes('h264_vaapi')) return 'vaapi';
    if (stdout.includes('h264_qsv')) return 'qsv';
    return null;
  } catch {
    return null;
  }
}

/**
 * Map an encoder handle to the ffmpeg codec name.
 * Returns `libx264` when encoder is null (CPU fallback).
 */
export function getGpuEncoderName(encoder: GpuEncoder, codec: 'h264'): string {
  if (!encoder) return 'libx264';
  switch (encoder) {
    case 'nvenc': return 'h264_nvenc';
    case 'videotoolbox': return 'h264_videotoolbox';
    case 'vaapi': return 'h264_vaapi';
    case 'qsv': return 'h264_qsv';
  }
}

/**
 * Whether GPU encoding is enabled for this process.
 * Controlled by `ARGO_USE_GPU` env var: unset/`'1'` → enabled, `'0'` → disabled.
 */
export function isGpuEncodingEnabled(): boolean {
  const v = process.env.ARGO_USE_GPU;
  return v === undefined || v === '1' || v === 'true';
}
