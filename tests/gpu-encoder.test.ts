import { describe, it, expect, beforeEach } from 'vitest';
import { detectGpuEncoder, getGpuEncoderName, resetGpuEncoderCache } from '../src/gpu-encoder.js';

describe('gpu-encoder', () => {
  beforeEach(() => resetGpuEncoderCache());

  it('detectGpuEncoder returns a valid encoder name or null', async () => {
    const enc = await detectGpuEncoder();
    expect(enc === null || ['nvenc', 'videotoolbox', 'vaapi', 'qsv'].includes(enc)).toBe(true);
  });

  it('caches the detection result', async () => {
    const a = await detectGpuEncoder();
    const b = await detectGpuEncoder();
    expect(a).toBe(b);
  });

  it('getGpuEncoderName maps encoder to ffmpeg codec name for h264', () => {
    expect(getGpuEncoderName('nvenc', 'h264')).toBe('h264_nvenc');
    expect(getGpuEncoderName('videotoolbox', 'h264')).toBe('h264_videotoolbox');
    expect(getGpuEncoderName('vaapi', 'h264')).toBe('h264_vaapi');
    expect(getGpuEncoderName('qsv', 'h264')).toBe('h264_qsv');
    expect(getGpuEncoderName(null, 'h264')).toBe('libx264');
  });
});
