import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NarrationTimeline } from '../src/narration.js';

/**
 * `atWord` matched on a token stripped by `[^\w']`, which is ASCII-only. Every
 * Cyrillic, Han and Devanagari word stripped to the empty string, so they all
 * compared equal: asking for any anchor returned the first word in the scene,
 * at a time that looked reasonable and was wrong. Accented Latin was mangled
 * rather than erased, so "Anträge" only matched a caller who also wrote it
 * without the umlaut.
 *
 * The transcript is cached per process on first read, so every case here shares
 * one file with a scene per language.
 */
const WORDS = (...pairs: Array<[string, number]>) =>
  pairs.map(([text, start]) => ({ text, start, end: start + 0.4 }));

const TRANSCRIPT = {
  version: 1,
  model: 'test',
  scenes: {
    ru: WORDS(['Две', 1], ['заявки,', 2], ['одобрены.', 3]),
    zh: WORDS(['两', 1], ['个', 2], ['申请', 3]),
    hi: WORDS(['दो', 1], ['अनुरोध,', 2], ['स्वीकृत।', 3]),
    de: WORDS(['Zwei', 1], ['Anträge,', 2], ['genehmigt.', 3]),
    en: WORDS(['Two', 1], ['requests,', 2], ['approved.', 3]),
  },
};

let dir: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'argo-atword-'));
  const path = join(dir, 'transcript.json');
  writeFileSync(path, JSON.stringify(TRANSCRIPT), 'utf-8');
  process.env.ARGO_TRANSCRIPT_PATH = path;
});

afterAll(() => {
  delete process.env.ARGO_TRANSCRIPT_PATH;
  rmSync(dir, { recursive: true, force: true });
});

/** A timeline sitting at the very start of `scene`. */
function atStartOf(scene: string): NarrationTimeline {
  const timeline = new NarrationTimeline();
  timeline.start();
  timeline.mark(scene);
  return timeline;
}

describe('atWord across scripts', () => {
  // Each case asks for the *third* word. Under the old normalisation every
  // non-Latin token was equal, so the first word matched and the answer came
  // back near 1000ms instead of near 3000ms.
  it.each([
    ['ru', 'одобрены'],
    ['zh', '申请'],
    ['hi', 'स्वीकृत'],
    ['de', 'genehmigt'],
    ['en', 'approved'],
  ])('finds the third word in %s and not the first', (scene, anchor) => {
    const ms = atStartOf(scene).atWord(scene, anchor);
    expect(ms).not.toBeNull();
    expect(ms).toBeGreaterThan(2500);
    expect(ms).toBeLessThanOrEqual(3000);
  });

  it('keeps a diacritic significant instead of stripping it', () => {
    // "Anträge" must be reachable as written. It also must not be reachable by
    // an ASCII-folded spelling, which the old behaviour accidentally allowed.
    expect(atStartOf('de').atWord('de', 'Anträge')).toBeGreaterThan(1500);
    expect(atStartOf('de').atWord('de', 'antrge')).toBeNull();
  });

  it('still ignores case and trailing punctuation', () => {
    expect(atStartOf('en').atWord('en', 'REQUESTS')).toBeGreaterThan(1500);
    expect(atStartOf('ru').atWord('ru', 'заявки')).toBeGreaterThan(1500);
  });

  it('returns null for a word the scene does not contain', () => {
    expect(atStartOf('ru').atWord('ru', 'отклонены')).toBeNull();
    expect(atStartOf('zh').atWord('zh', '批准')).toBeNull();
  });
});
