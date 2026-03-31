import { describe, it, expect } from 'vitest';
import { buildFrameFilter } from '../src/frame.js';

describe('buildFrameFilter', () => {
  it('returns null when padding is 0', () => {
    const result = buildFrameFilter('0:v', 1920, 1080, { padding: 0 }, 2);
    expect(result).toBeNull();
  });

  it('returns null when inner dimensions would be <= 0', () => {
    const result = buildFrameFilter('0:v', 80, 80, { padding: 50 }, 2);
    expect(result).toBeNull();
  });

  it('builds filter with default settings (solid black background)', () => {
    const result = buildFrameFilter('0:v', 1920, 1080, {}, 2);
    expect(result).not.toBeNull();
    expect(result!.videoSource).toBe('frm_out');
    expect(result!.addedInputs).toBe(0);
    expect(result!.inputArgs).toEqual([]);

    const fc = result!.filterParts.join(';\n');
    // Should scale inner video
    expect(fc).toContain('scale=1840:1000:flags=lanczos');
    // Should apply rounded corners
    expect(fc).toContain('format=yuva444p');
    expect(fc).toContain('geq=');
    // Should create solid black background
    expect(fc).toContain('color=c=#000000:s=1920x1080:d=1,loop=-1:1:0');
    // Should have shadow (default 0.5)
    expect(fc).toContain('boxblur=');
    expect(fc).toContain('split[frm_fg][frm_shadow_src]');
    // Should have final overlay
    expect(fc).toContain('overlay=40:40:format=auto:shortest=1[frm_out]');
  });

  it('disables shadow when shadow is 0', () => {
    const result = buildFrameFilter('0:v', 1920, 1080, { shadow: 0 }, 2);
    expect(result).not.toBeNull();
    const fc = result!.filterParts.join(';\n');
    // Should NOT have shadow split
    expect(fc).not.toContain('frm_shadow');
    // Should directly overlay on background
    expect(fc).toContain('[frm_bg][frm_rounded]overlay=40:40:format=auto:shortest=1[frm_out]');
  });

  it('disables rounded corners when borderRadius is 0', () => {
    const result = buildFrameFilter('0:v', 1920, 1080, { borderRadius: 0 }, 2);
    expect(result).not.toBeNull();
    const fc = result!.filterParts.join(';\n');
    // Should NOT have geq alpha mask
    expect(fc).not.toContain('geq=');
    // Should just convert to yuva format
    expect(fc).toContain('format=yuva444p[frm_rounded]');
  });

  it('uses custom padding', () => {
    const result = buildFrameFilter('0:v', 1920, 1080, { padding: 80 }, 2);
    expect(result).not.toBeNull();
    const fc = result!.filterParts.join(';\n');
    // Inner dimensions: 1920 - 160 = 1760, 1080 - 160 = 920
    expect(fc).toContain('scale=1760:920:flags=lanczos');
    expect(fc).toContain('overlay=80:80:format=auto:shortest=1[frm_out]');
  });

  it('uses solid color background', () => {
    const result = buildFrameFilter('0:v', 1920, 1080, {
      background: { type: 'solid', value: '#1a1a2e' },
    }, 2);
    expect(result).not.toBeNull();
    const fc = result!.filterParts.join(';\n');
    expect(fc).toContain('color=c=#1a1a2e:s=1920x1080:d=1,loop=-1:1:0');
  });

  it('uses gradient background', () => {
    const result = buildFrameFilter('0:v', 1920, 1080, {
      background: { type: 'gradient', value: 'linear-gradient(135deg, #667eea, #764ba2)' },
    }, 2);
    expect(result).not.toBeNull();
    const fc = result!.filterParts.join(';\n');
    expect(fc).toContain('gradients=');
    expect(fc).toContain('c0=#667eea');
    expect(fc).toContain('c1=#764ba2');
  });

  it('uses image background with added input', () => {
    const result = buildFrameFilter('0:v', 1920, 1080, {
      background: { type: 'image', value: 'assets/bg.jpg' },
    }, 3);
    expect(result).not.toBeNull();
    expect(result!.addedInputs).toBe(1);
    expect(result!.inputArgs).toEqual(['-i', 'assets/bg.jpg']);
    const fc = result!.filterParts.join(';\n');
    expect(fc).toContain('[3:v]scale=1920:1080');
  });

  it('falls back to first color when gradient parsing fails', () => {
    const result = buildFrameFilter('0:v', 1920, 1080, {
      background: { type: 'gradient', value: 'radial-gradient(circle, #ff0000, #0000ff)' },
    }, 2);
    expect(result).not.toBeNull();
    const fc = result!.filterParts.join(';\n');
    // Should fall back to first color found
    expect(fc).toContain('color=c=#ff0000:s=1920x1080:d=1,loop=-1:1:0');
  });

  it('handles upstream filter label correctly', () => {
    const result = buildFrameFilter('camfinal', 1920, 1080, {}, 2);
    expect(result).not.toBeNull();
    const fc = result!.filterParts.join(';\n');
    expect(fc).toContain('[camfinal]scale=');
  });
});
