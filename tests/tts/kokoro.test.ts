import { describe, it, expect } from 'vitest';
import { KokoroEngine } from '../../src/tts/kokoro.js';
import { parseWavHeader } from '../../src/tts/engine.js';
import { isDepInstalled, KOKORO_DEP } from '../../src/optional-deps.js';

const describeIntegration = process.env.CI || !isDepInstalled(KOKORO_DEP) ? describe.skip : describe;

describeIntegration('KokoroEngine (integration)', () => {
  const engine = new KokoroEngine();

  it('generates valid WAV from text', async () => {
    const wav = await engine.generate('Hello world', { voice: 'af_heart' });
    expect(wav).toBeInstanceOf(Buffer);
    expect(wav.length).toBeGreaterThan(44);

    const header = parseWavHeader(wav);
    expect(header.sampleRate).toBeGreaterThan(0);
    expect(header.numChannels).toBe(1);
    expect(header.durationMs).toBeGreaterThan(0);
  }, 120_000);

  it('throws on empty text', async () => {
    await expect(engine.generate('', {})).rejects.toThrow('TTS text must not be empty');
    await expect(engine.generate('   ', {})).rejects.toThrow('TTS text must not be empty');
  });
}, 180_000);
