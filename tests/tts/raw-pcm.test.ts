import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertToWav, parseRawAudioMime } from '../../src/tts/engine.js';
import { execFileSync } from 'node:child_process';

// `engine.ts` reads `execFileSync` off the namespace at call time, so the whole
// module has to be replaced. An ESM namespace object cannot be spied on.
vi.mock('node:child_process', async importOriginal => ({
  ...(await importOriginal<typeof import('node:child_process')>()),
  execFileSync: vi.fn(() => Buffer.from('fake-wav')),
}));

/**
 * Gemini's TTS models return RFC 2586 linear PCM: sample data with no RIFF
 * header and no magic bytes. `ffmpeg -i pipe:0` cannot sniff that and dies with
 * "Invalid data found when processing input", so every Gemini clip failed to
 * convert. The format has to be read off the media type and handed to ffmpeg.
 *
 * Self-describing containers must keep going through ffmpeg's own probing:
 * forcing a demuxer on an MP3 would decode noise.
 */
describe('parseRawAudioMime', () => {
  it('reads codec, rate and channels out of a Gemini media type', () => {
    expect(parseRawAudioMime('audio/L16;codec=pcm;rate=24000')).toEqual({
      codec: 's16le',
      sampleRate: 24000,
      channels: 1,
    });
  });

  it('accepts an explicit channel count', () => {
    expect(parseRawAudioMime('audio/L16;codec=pcm;rate=16000;channels=2')).toEqual({
      codec: 's16le',
      sampleRate: 16000,
      channels: 2,
    });
  });

  it('tolerates spacing and case', () => {
    expect(parseRawAudioMime('AUDIO/L16; CODEC=pcm; RATE=48000')).toEqual({
      codec: 's16le',
      sampleRate: 48000,
      channels: 1,
    });
  });

  it('falls back to 24kHz mono when the rate is absent or junk', () => {
    expect(parseRawAudioMime('audio/L16;codec=pcm')?.sampleRate).toBe(24000);
    expect(parseRawAudioMime('audio/L16;rate=abc')?.sampleRate).toBe(24000);
    expect(parseRawAudioMime('audio/L16;rate=0')?.sampleRate).toBe(24000);
  });

  it('leaves self-describing containers to ffmpeg', () => {
    expect(parseRawAudioMime('audio/mpeg')).toBeNull();
    expect(parseRawAudioMime('audio/wav')).toBeNull();
    expect(parseRawAudioMime('audio/ogg;codecs=opus')).toBeNull();
    expect(parseRawAudioMime(undefined)).toBeNull();
  });
});

describe('convertToWav input format', () => {
  beforeEach(() => {
    vi.mocked(execFileSync).mockClear();
  });

  /** The ffmpeg argv as it would actually be spawned. */
  function args(): string[] {
    return vi.mocked(execFileSync).mock.calls[0][1] as string[];
  }

  it('declares the demuxer before the input when given a raw format', () => {
    convertToWav(Buffer.from('pcm'), 1, { codec: 's16le', sampleRate: 24000, channels: 1 });
    const argv = args();
    expect(argv.slice(0, 8)).toEqual([
      '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', 'pipe:0',
    ]);
  });

  it('leaves the command untouched when no raw format is given', () => {
    convertToWav(Buffer.from('mp3'));
    expect(args()[0]).toBe('-i');
    expect(args()).not.toContain('s16le');
  });

  it('treats a null format the same as an absent one', () => {
    convertToWav(Buffer.from('mp3'), 1, null);
    expect(args()[0]).toBe('-i');
  });

  it('still applies speed to a raw stream', () => {
    convertToWav(Buffer.from('pcm'), 1.5, { codec: 's16le', sampleRate: 24000, channels: 1 });
    const argv = args();
    expect(argv).toContain('atempo=1.5');
    // The demuxer applies to the input and the tempo filter to the output, so
    // the order between them is load-bearing.
    expect(argv.indexOf('-f')).toBeLessThan(argv.indexOf('-i'));
    expect(argv.indexOf('-filter:a')).toBeGreaterThan(argv.indexOf('-i'));
  });
});
