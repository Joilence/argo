import { spawn } from 'node:child_process';

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
  cached = await probeEncoders();
  return cached;
}

export function resetGpuEncoderCache(): void {
  cached = undefined;
}

function probeEncoders(): Promise<GpuEncoder> {
  return new Promise((resolve) => {
    const proc = spawn('ffmpeg', ['-encoders'], { stdio: ['ignore', 'pipe', 'ignore'] });
    let out = '';
    proc.stdout.on('data', (chunk) => { out += chunk.toString(); });
    proc.on('close', () => {
      if (out.includes('h264_nvenc')) return resolve('nvenc');
      if (out.includes('h264_videotoolbox')) return resolve('videotoolbox');
      if (out.includes('h264_vaapi')) return resolve('vaapi');
      if (out.includes('h264_qsv')) return resolve('qsv');
      resolve(null);
    });
    proc.on('error', () => resolve(null));
  });
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
