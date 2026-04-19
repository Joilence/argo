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
});
