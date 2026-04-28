import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const { execFileMock } = vi.hoisted(() => ({
  execFileMock: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  execFile: execFileMock,
}));

import { record } from '../src/record.js';

const originalCwd = process.cwd();

describe('record', () => {
  let tempDir: string;

  beforeEach(async () => {
    execFileMock.mockReset();
    tempDir = await mkdtemp(join(tmpdir(), 'argo-record-'));
    process.chdir(tempDir);
    mkdirSync('custom-demos', { recursive: true });
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(tempDir, { recursive: true, force: true });
  });

  // Common mock: simulate the in-process narration fixture writing the
  // screencast directly to ARGO_SCREENCAST_PATH and the timing JSON.
  function mockSubprocessSuccess() {
    execFileMock.mockImplementation((_cmd, _args, options, callback) => {
      const argoOutputDir = options.env.ARGO_OUTPUT_DIR as string;
      const screencastPath = options.env.ARGO_SCREENCAST_PATH as string;

      mkdirSync(resolve(tempDir, argoOutputDir), { recursive: true });
      writeFileSync(screencastPath, 'video');
      writeFileSync(resolve(tempDir, argoOutputDir, '.timing.json'), '{}');

      callback(null, '', '');
      return {} as never;
    });
  }

  it('generates a Playwright config from record options and lands the screencast at the known path', async () => {
    mockSubprocessSuccess();

    const result = await record('demo', {
      demosDir: 'custom-demos',
      baseURL: 'http://localhost:4321',
      video: { width: 1280, height: 720 },
    });

    const configPath = join(tempDir, '.argo', 'demo', 'playwright.record.config.mjs');
    const config = readFileSync(configPath, 'utf-8');

    expect(config).toContain(`testDir: ${JSON.stringify(resolve('custom-demos'))}`);
    expect(config).toContain(`baseURL: ${JSON.stringify('http://localhost:4321')}`);
    expect(config).toContain('viewport: { width: 1280, height: 720 }');
    // Recording is driven by page.screencast.start() in the fixture, not Playwright recordVideo.
    expect(config).toContain("video: 'off'");
    expect(existsSync(join(tempDir, '.argo', 'demo', 'video.webm'))).toBe(true);
    expect(result).toEqual({
      videoPath: join('.argo', 'demo', 'video.webm'),
      timingPath: join('.argo', 'demo', '.timing.json'),
    });
    expect(execFileMock).toHaveBeenCalledWith(
      'npx',
      [
        'playwright',
        'test',
        '--config',
        join('.argo', 'demo', 'playwright.record.config.mjs'),
        '--grep',
        'demo',
        '--project',
        'demos',
      ],
      expect.objectContaining({
        env: expect.objectContaining({
          ARGO_OUTPUT_DIR: resolve(join('.argo', 'demo')),
          ARGO_SCREENCAST_PATH: resolve(join('.argo', 'demo', 'video.webm')),
          ARGO_SCREENCAST_WIDTH: '1280',
          ARGO_SCREENCAST_HEIGHT: '720',
          BASE_URL: 'http://localhost:4321',
        }),
      }),
      expect.any(Function),
    );
  });

  it('normalizes deviceScaleFactor and scales the screencast size env accordingly', async () => {
    mockSubprocessSuccess();

    await record('demo', {
      demosDir: 'custom-demos',
      baseURL: 'http://localhost:4321',
      video: { width: 1280, height: 720 },
      browser: 'webkit',
      deviceScaleFactor: 1.6,
    });

    const configPath = join(tempDir, '.argo', 'demo', 'playwright.record.config.mjs');
    const config = readFileSync(configPath, 'utf-8');

    expect(config).toContain("browserName: \"webkit\"");
    expect(config).toContain('deviceScaleFactor: 2');
    expect(execFileMock).toHaveBeenCalledWith(
      'npx',
      expect.any(Array),
      expect.objectContaining({
        env: expect.objectContaining({
          ARGO_SCREENCAST_WIDTH: '2560',
          ARGO_SCREENCAST_HEIGHT: '1440',
        }),
      }),
      expect.any(Function),
    );
  });

  it('includes isMobile, hasTouch, and contextOptions in generated config', async () => {
    mockSubprocessSuccess();

    await record('demo', {
      demosDir: 'custom-demos',
      baseURL: 'http://localhost:3000',
      video: { width: 390, height: 664 },
      browser: 'webkit',
      isMobile: true,
      hasTouch: true,
      contextOptions: { colorScheme: 'dark' },
    });

    const configPath = join(tempDir, '.argo', 'demo', 'playwright.record.config.mjs');
    const config = readFileSync(configPath, 'utf-8');

    expect(config).toContain('viewport: { width: 390, height: 664 }');
    expect(config).toContain('isMobile: true');
    expect(config).toContain('hasTouch: true');
    expect(config).toContain('colorScheme: "dark"');
  });
});
