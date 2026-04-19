import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SHADERS, isValidShaderName, SHADER_NAMES } from '../../src/transitions/shaders/index.js';
import type { TransitionConfig } from '../../src/config.js';

describe('shader registry', () => {
  it('ships exactly the v1 five shaders', () => {
    expect(SHADER_NAMES).toEqual(['crosswarp', 'swirl', 'ripple', 'luma-mask', 'light-leak']);
  });

  it('each shader has non-empty GLSL source', () => {
    for (const name of SHADER_NAMES) {
      expect(SHADERS[name].length).toBeGreaterThan(50);
      expect(SHADERS[name]).toContain('uniform');
      expect(SHADERS[name]).toContain('progress');
    }
  });

  it('isValidShaderName checks membership', () => {
    expect(isValidShaderName('crosswarp')).toBe(true);
    expect(isValidShaderName('bogus')).toBe(false);
  });
});

describe('TransitionConfig shader variant', () => {
  it('accepts { type: "shader", shader: ... } at compile time', () => {
    const cfg: TransitionConfig = {
      type: 'shader',
      shader: 'crosswarp',
      durationMs: 800,
    };
    expect(cfg.type).toBe('shader');
  });
});

describe('computeShaderHash', () => {
  let tmp: string;
  beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), 'argo-shader-hash-')); });
  afterEach(() => { rmSync(tmp, { recursive: true, force: true }); });

  it('produces stable hash for identical inputs', async () => {
    const { computeShaderHash } = await import('../../src/transitions/shader-render.js');
    const a = join(tmp, 'a.png');
    const b = join(tmp, 'b.png');
    writeFileSync(a, Buffer.from('aaa'));
    writeFileSync(b, Buffer.from('bbb'));
    const h1 = computeShaderHash('crosswarp', 800, 30, 1920, 1080, a, b);
    const h2 = computeShaderHash('crosswarp', 800, 30, 1920, 1080, a, b);
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{16}$/);
  });

  it('differs when shader name changes', async () => {
    const { computeShaderHash } = await import('../../src/transitions/shader-render.js');
    const a = join(tmp, 'a.png');
    const b = join(tmp, 'b.png');
    writeFileSync(a, Buffer.from('aaa'));
    writeFileSync(b, Buffer.from('bbb'));
    expect(
      computeShaderHash('crosswarp', 800, 30, 1920, 1080, a, b)
    ).not.toBe(
      computeShaderHash('swirl', 800, 30, 1920, 1080, a, b)
    );
  });

  it('differs when boundary frame content changes', async () => {
    const { computeShaderHash } = await import('../../src/transitions/shader-render.js');
    const a = join(tmp, 'a.png');
    const b = join(tmp, 'b.png');
    writeFileSync(a, Buffer.from('aaa'));
    writeFileSync(b, Buffer.from('bbb'));
    const h1 = computeShaderHash('crosswarp', 800, 30, 1920, 1080, a, b);
    writeFileSync(a, Buffer.from('different'));
    const h2 = computeShaderHash('crosswarp', 800, 30, 1920, 1080, a, b);
    expect(h1).not.toBe(h2);
  });
});
