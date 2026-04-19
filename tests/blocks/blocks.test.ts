import { describe, it, expect } from 'vitest';
import { BLOCK_REGISTRY, isValidBlockName, getBlock } from '../../src/blocks/index.js';
import type { OverlayCue } from '../../src/overlays/types.js';
import { renderTemplate } from '../../src/overlays/templates.js';

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

describe('x-post block', () => {
  it('renders handle, name, and body', () => {
    const result = renderTemplate({
      type: 'block',
      block: 'x-post',
      props: {
        handle: '@jane',
        name: 'Jane Doe',
        body: 'this is exactly what I needed',
        timestamp: '2m',
      },
    }, 'dark');

    expect(result.contentHtml).toContain('Jane Doe');
    expect(result.contentHtml).toContain('@jane');
    expect(result.contentHtml).toContain('this is exactly what I needed');
    expect(result.contentHtml).toContain('2m');
  });

  it('escapes HTML in user-provided fields', () => {
    const result = renderTemplate({
      type: 'block',
      block: 'x-post',
      props: {
        handle: '@x',
        name: '<script>alert(1)</script>',
        body: 'ok',
        timestamp: 'now',
      },
    }, 'dark');
    expect(result.contentHtml).not.toContain('<script>');
    expect(result.contentHtml).toContain('&lt;script&gt;');
  });

  it('applies defaults for missing optional props', () => {
    const result = renderTemplate({
      type: 'block',
      block: 'x-post',
      props: { handle: '@x', name: 'X', body: 'hi' },
    }, 'dark');
    expect(result.contentHtml).toContain('X');
  });
});
