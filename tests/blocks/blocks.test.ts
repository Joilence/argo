import { describe, it, expect } from 'vitest';
import { BLOCK_REGISTRY, isValidBlockName, getBlock } from '../../src/blocks/index.js';

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
