import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { exportVideo } from '../src/export.js';

const mediaAvailable = ['ffmpeg', 'ffprobe'].every(command => spawnSync(command, ['-version']).status === 0);

function firstPixel(file: string): Buffer {
  return execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-frames:v', '1', '-vf', 'format=rgb24,crop=1:1', '-f', 'rawvideo', '-']);
}

describe.skipIf(!mediaAvailable)('exported colors', () => {
  it.each([
    { name: 'limited WebM', extension: 'webm', args: ['-c:v', 'libvpx'] },
    { name: 'full-range JPEG', extension: 'mov', args: ['-c:v', 'mjpeg', '-pix_fmt', 'yuvj420p'] },
    { name: 'tagged BT.709', extension: 'mp4', args: ['-vf', 'scale=out_color_matrix=bt709', '-c:v', 'libx264', '-colorspace', 'bt709', '-color_range', 'tv'] },
  ])('preserves decoded $name colors in the master and aspect copies', async ({ extension, args }) => {
    const root = mkdtempSync(join(tmpdir(), 'argo-export-color-'));
    try {
      const demo = join(root, '.argo', 'demo');
      mkdirSync(demo, { recursive: true });
      const source = join(demo, `video.${extension}`);
      execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'color=c=0x1382ef:size=320x192:rate=30', '-frames:v', '3', ...args, source]);
      const expected = firstPixel(source);
      await exportVideo({
        demoName: 'demo', argoDir: join(root, '.argo'), outputDir: join(root, 'output'),
        fps: 30, preset: 'ultrafast', crf: 10, encoder: 'cpu', outputWidth: 320, outputHeight: 192,
        formats: ['1:1', '9:16'],
      });
      for (const name of ['demo.mp4', 'demo.1x1.mp4', 'demo.9x16.mp4']) {
        const output = join(root, 'output', name);
        const actual = firstPixel(output);
        const squaredError = actual.reduce((sum, channel, index) => sum + (channel - expected[index]) ** 2, 0);
        expect(Math.sqrt(squaredError / 3) / 255, name).toBeLessThan(0.02);
        const metadata: { streams: { color_range: string; color_space: string }[] } = JSON.parse(
          execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=color_range,color_space', '-of', 'json', output], { encoding: 'utf8' }),
        );
        expect(metadata.streams[0]).toEqual({ color_range: 'tv', color_space: 'bt709' });
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 30000);
});
