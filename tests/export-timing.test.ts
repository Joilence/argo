import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { exportVideo } from '../src/export.js';

const mediaAvailable = ['ffmpeg', 'ffprobe'].every(command => spawnSync(command, ['-version']).status === 0);

describe.skipIf(!mediaAvailable)('exported MP4 timing', () => {
  let root: string;
  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'argo-export-timing-'));
    const demo = join(root, '.argo', 'demo');
    mkdirSync(demo, { recursive: true });
    execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=160x90:rate=30', '-frames:v', '32', '-c:v', 'libx264', join(demo, 'video.mp4')]);
    execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=24000:duration=1.1', '-c:a', 'pcm_f32le', join(demo, 'narration-aligned.wav')]);
    execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'color=blue:s=160x90', '-frames:v', '1', join(root, 'cover.png')]);
    writeFileSync(join(root, 'chapters.txt'), ';FFMETADATA1\n[CHAPTER]\nTIMEBASE=1/90000\nSTART=0\nEND=3000\ntitle=Intro\n[CHAPTER]\nTIMEBASE=1/90000\nSTART=3000\nEND=96000\ntitle=Frame-aligned chapter\n');
  });
  afterAll(() => { if (root) rmSync(root, { recursive: true, force: true }); });

  it('preserves frame-aligned chapter boundaries in the master and aspect-ratio copy', async () => {
    await exportVideo({
      demoName: 'demo', argoDir: join(root, '.argo'), outputDir: join(root, 'output'),
      fps: 30, preset: 'ultrafast', encoder: 'cpu', outputWidth: 160, outputHeight: 90,
      thumbnailPath: join(root, 'cover.png'), chapterMetadataPath: join(root, 'chapters.txt'),
      formats: ['1:1'],
    });
    for (const name of ['demo.mp4', 'demo.1x1.mp4']) {
      const metadata: { chapters: { start_time: string; end_time: string; tags: { title: string } }[] } = JSON.parse(
        execFileSync('ffprobe', ['-v', 'error', '-show_chapters', '-of', 'json', join(root, 'output', name)], { encoding: 'utf8' }),
      );
      expect(metadata.chapters).toHaveLength(2);
      expect(metadata.chapters[1].tags.title).toBe('Frame-aligned chapter');
      expect(Number(metadata.chapters[1].start_time)).toBeCloseTo(1 / 30, 5);
      expect(Number(metadata.chapters[1].end_time)).toBeCloseTo(32 / 30, 5);
    }
  }, 30000);

  it('does not add a timestamp gap at normalized audio EOF, including a music mix', async () => {
    const demo = join(root, '.argo', 'normalization');
    mkdirSync(demo, { recursive: true });
    execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=160x90:rate=30', '-frames:v', '370', '-c:v', 'libx264', join(demo, 'video.mp4')]);
    const audio = join(demo, 'narration-aligned.wav');
    execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=24000:duration=12.333', '-c:a', 'pcm_f32le', audio]);
    for (const mixed of [false, true]) {
      const output = await exportVideo({
        demoName: 'normalization', argoDir: join(root, '.argo'), outputDir: join(root, mixed ? 'mixed' : 'direct'),
        fps: 30, preset: 'ultrafast', encoder: 'cpu', loudnorm: true,
        thumbnailPath: join(root, 'cover.png'), musicPath: mixed ? audio : undefined,
      });
      const duration = Number(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=duration', '-of', 'default=nw=1:nk=1', output], { encoding: 'utf8' }));
      expect(duration).toBeCloseTo(12.333, 3);
    }
  }, 30000);
});
