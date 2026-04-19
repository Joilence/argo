import { describe, it, expect } from 'vitest';
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
