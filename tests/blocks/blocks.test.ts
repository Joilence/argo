import { describe, it, expect } from 'vitest';
import { BLOCK_REGISTRY, isValidBlockName, getBlock } from '../../src/blocks/index.js';
import type { OverlayCue } from '../../src/overlays/types.js';

describe('block registry', () => {
  it('exposes a frozen registry object', () => {
    expect(Object.isFrozen(BLOCK_REGISTRY)).toBe(true);
  });

  it('isValidBlockName returns false for unknown names', () => {
    expect(isValidBlockName('nonexistent-block')).toBe(false);
  });

  it('getBlock throws for unknown names', () => {
    expect(() => getBlock('nonexistent-block' as never)).toThrow(/unknown block/i);
  });
});

describe('CustomBlockCue', () => {
  it('accepts type="block" in OverlayCue union', () => {
    // Compile-time check: this assignment is the test.
    const cue: OverlayCue = {
      type: 'block',
      block: 'x-post' as never, // real name will exist after Task 3
      props: { handle: '@test' },
    };
    expect(cue.type).toBe('block');
  });
});
