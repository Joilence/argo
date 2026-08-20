import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import {
  assertValidLang,
  resolveArgoSubdir,
  resolveManifestPath,
  resolveOutputName,
} from '../src/timeline.js';

/**
 * A language variant is not a viewport variant. `export.variants` re-records
 * one TTS pass at several sizes, so its runs share every clip; a language
 * changes the narration, which changes each scene's duration, which changes how
 * long the browser is held, so nothing is shareable and every path a run writes
 * has to be its own.
 *
 * The two rules below are what keep two locales of one demo from reading each
 * other's files, which is the failure this feature exists to make impossible.
 */
describe('resolveManifestPath', () => {
  it('reads the base manifest when no language is given', () => {
    expect(resolveManifestPath('demos', 'checkout')).toBe(join('demos', 'checkout.scenes.json'));
  });

  it('reads a language manifest out of the locales subdirectory', () => {
    expect(resolveManifestPath('demos', 'checkout', 'de')).toBe(
      join('demos', 'locales', 'checkout.de.scenes.json'),
    );
  });

  it('keeps language manifests out of demosDir, where discoverDemos would claim them', () => {
    // discoverDemos treats every *.scenes.json in demosDir as a demo. A sibling
    // `checkout.de.scenes.json` would become a demo named `checkout.de` with no
    // matching .demo.ts, and `pipeline --all` would fail on it.
    const path = resolveManifestPath('demos', 'checkout', 'de');
    expect(path.startsWith(join('demos', 'locales'))).toBe(true);
  });

  it('keeps a region subtag intact', () => {
    expect(resolveManifestPath('demos', 'checkout', 'zh-CN')).toBe(
      join('demos', 'locales', 'checkout.zh-CN.scenes.json'),
    );
  });
});

describe('resolveArgoSubdir', () => {
  it('is the demo name when no language is given', () => {
    expect(resolveArgoSubdir('checkout')).toBe('checkout');
  });

  it('is per language otherwise, so clips and transcripts cannot be crossed', () => {
    expect(resolveArgoSubdir('checkout', 'de')).toBe('checkout-de');
    expect(resolveArgoSubdir('checkout', 'fr')).toBe('checkout-fr');
  });

  it('does not collide with the base demo directory', () => {
    // The real risk is a language run writing into `.argo/checkout`, which is
    // where the base demo's clips and video live. Four distinct template
    // expansions cannot collide with each other, so asserting that proves
    // nothing; this asserts the pair that actually shares a parent.
    expect(resolveArgoSubdir('checkout', 'de')).not.toBe(resolveArgoSubdir('checkout'));
  });
});

describe('resolveOutputName', () => {
  it('is the demo name when no language is given', () => {
    expect(resolveOutputName('checkout')).toBe('checkout');
  });

  it('separates with a dot, matching the existing variant artifacts', () => {
    // `<demo>.<variant>.mp4` already exists, so a language reads as another
    // artifact of the same demo rather than as a second naming scheme.
    expect(resolveOutputName('checkout', 'de')).toBe('checkout.de');
  });

  it('does not overwrite the base demo', () => {
    expect(resolveOutputName('checkout', 'de')).not.toBe(resolveOutputName('checkout'));
  });
});

describe('assertValidLang', () => {
  it.each(['de', 'fr', 'zh-CN', 'pt-BR', 'en-AU', 'fil'])('accepts %s', tag => {
    expect(() => assertValidLang(tag)).not.toThrow();
  });

  // `lang` reaches a path join on the read side and a mkdir on the write side,
  // so a traversal both reads outside demosDir and writes outside .argo.
  it.each([
    '../../../tmp/pwn',
    '..',
    'de/../..',
    'de fr',
    '',
    'd',
  ])('rejects %s', tag => {
    expect(() => assertValidLang(tag)).toThrow(/invalid --lang/);
  });
});
