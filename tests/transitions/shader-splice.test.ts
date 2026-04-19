import { describe, it, expect } from 'vitest';
import { buildShaderSpliceFilter } from '../../src/transitions/shader-splice.js';

describe('buildShaderSpliceFilter', () => {
  it('produces a three-segment concat per boundary for single-boundary case', () => {
    const result = buildShaderSpliceFilter({
      totalDurationSec: 6.0,
      boundaries: [
        { boundarySec: 3.0, durationMs: 800, extraInputIndex: 2 },
      ],
      videoInputLabel: '[0:v]',
      audioInputLabel: '[1:a]',
      fps: 30,
    });

    expect(result.filterComplex).toContain('trim=0.000:2.600');
    expect(result.filterComplex).toContain('trim=3.400:6.000');
    expect(result.filterComplex).toContain('[2:v]');
    expect(result.filterComplex).toMatch(/concat=n=3:v=1:a=1/);
    expect(result.videoOutput).toBe('[svout]');
    expect(result.audioOutput).toBe('[saout]');
  });

  it('handles two boundaries (five-segment concat)', () => {
    const result = buildShaderSpliceFilter({
      totalDurationSec: 9.0,
      boundaries: [
        { boundarySec: 3.0, durationMs: 600, extraInputIndex: 2 },
        { boundarySec: 6.0, durationMs: 600, extraInputIndex: 3 },
      ],
      videoInputLabel: '[0:v]',
      audioInputLabel: '[1:a]',
      fps: 30,
    });

    expect(result.filterComplex).toMatch(/concat=n=5:v=1:a=1/);
    expect(result.filterComplex).toContain('[2:v]');
    expect(result.filterComplex).toContain('[3:v]');
  });

  it('works without audio', () => {
    const result = buildShaderSpliceFilter({
      totalDurationSec: 4.0,
      boundaries: [{ boundarySec: 2.0, durationMs: 500, extraInputIndex: 1 }],
      videoInputLabel: '[0:v]',
      audioInputLabel: null,
      fps: 30,
    });
    expect(result.filterComplex).toMatch(/concat=n=3:v=1:a=0/);
    expect(result.audioOutput).toBeNull();
  });

  it('clamps sceneEnd when a boundary is near the video start', () => {
    // Without clamping, sceneEnd = 0.15 - 0.2 = -0.05 → invalid trim=0:-0.05
    const result = buildShaderSpliceFilter({
      totalDurationSec: 4.0,
      boundaries: [{ boundarySec: 0.15, durationMs: 400, extraInputIndex: 2 }],
      videoInputLabel: '[0:v]',
      audioInputLabel: '[1:a]',
      fps: 30,
    });
    // Scene A trim clamps to trim=0:0 (zero-length, ffmpeg accepts)
    expect(result.filterComplex).toContain('trim=0.000:0.000');
    // After transition window, cursor is 0.350 — rest of video is [0.350, 4.0]
    expect(result.filterComplex).toContain('trim=0.350:4.000');
  });

  it('clamps transitionEnd when a boundary is near the video end', () => {
    // Without clamping, transitionEnd = 2.85 + 0.2 = 3.05 > totalDuration 3.0
    const result = buildShaderSpliceFilter({
      totalDurationSec: 3.0,
      boundaries: [{ boundarySec: 2.85, durationMs: 400, extraInputIndex: 2 }],
      videoInputLabel: '[0:v]',
      audioInputLabel: null,
      fps: 30,
    });
    // Scene A runs to 2.65, transition ends clamped at 3.0, last segment is [3.0, 3.0]
    expect(result.filterComplex).toContain('trim=0.000:2.650');
    expect(result.filterComplex).toMatch(/concat=n=3/);
  });
});
