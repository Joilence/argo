import { describe, it, expect } from 'vitest';
import { SHADERS, isValidShaderName, SHADER_NAMES } from '../../src/transitions/shaders/index.js';

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
