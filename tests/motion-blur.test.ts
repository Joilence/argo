import { describe, it, expect } from 'vitest';
import { buildMotionBlurFilter } from '../src/camera-move.js';

describe('buildMotionBlurFilter', () => {
  it('returns null when intensity is 0', () => {
    expect(buildMotionBlurFilter('[camfinal]', 0)).toBeNull();
  });

  it('returns null when intensity is negative', () => {
    expect(buildMotionBlurFilter('[camfinal]', -0.5)).toBeNull();
  });

  it('builds tblend filter with default intensity', () => {
    const result = buildMotionBlurFilter('[camfinal]');
    expect(result).not.toBeNull();
    expect(result!.outputLabel).toBe('mblur');
    expect(result!.filter).toContain('tblend=all_mode=average:all_opacity=0.50');
    expect(result!.filter).toContain('[camfinal]');
    expect(result!.filter).toContain('[mblur]');
  });

  it('uses custom intensity', () => {
    const result = buildMotionBlurFilter('[camfinal]', 0.8);
    expect(result).not.toBeNull();
    expect(result!.filter).toContain('all_opacity=0.80');
  });

  it('clamps intensity to 1.0 max', () => {
    const result = buildMotionBlurFilter('[camfinal]', 2.0);
    expect(result).not.toBeNull();
    expect(result!.filter).toContain('all_opacity=1.00');
  });
});
