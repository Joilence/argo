import { describe, it, expect } from 'vitest';
import { resolveManifestPath, resolveArgoSubdir } from '../src/timeline.js';

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
    expect(resolveManifestPath('demos', 'checkout')).toBe('demos/checkout.scenes.json');
  });

  it('reads a language manifest out of the locales subdirectory', () => {
    expect(resolveManifestPath('demos', 'checkout', 'de')).toBe(
      'demos/locales/checkout.de.scenes.json',
    );
  });

  it('keeps language manifests out of demosDir, where discoverDemos would claim them', () => {
    // discoverDemos treats every *.scenes.json in demosDir as a demo. A sibling
    // `checkout.de.scenes.json` would become a demo named `checkout.de` with no
    // matching .demo.ts, and `pipeline --all` would fail on it.
    const path = resolveManifestPath('demos', 'checkout', 'de');
    expect(path.startsWith('demos/locales/')).toBe(true);
  });

  it('keeps a region subtag intact', () => {
    expect(resolveManifestPath('demos', 'checkout', 'zh-CN')).toBe(
      'demos/locales/checkout.zh-CN.scenes.json',
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

  it('never collides between two languages of one demo', () => {
    const dirs = ['de', 'fr', 'zh-CN', undefined].map(l => resolveArgoSubdir('checkout', l));
    expect(new Set(dirs).size).toBe(dirs.length);
  });
});
