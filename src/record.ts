import { execFile } from 'node:child_process';
import { mkdirSync, existsSync, rmSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { startAssetServer, type AssetServer } from './asset-server.js';
import { loadOverlayManifest, hasImageAssets } from './overlays/manifest.js';
import { normalizeDeviceScaleFactor, type BrowserEngine, type ShowActionsConfig } from './config.js';

export interface RecordOptions {
  demosDir: string;
  baseURL: string;
  video: { width: number; height: number };
  browser?: BrowserEngine;
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
  contextOptions?: Record<string, unknown>;
  autoBackground?: boolean;
  defaultPlacement?: string;
  allowRawGsap?: boolean;
  headed?: boolean;
  /** Override the .argo subdirectory name (for variants). Default: demoName. */
  argoSubdir?: string;
  /** Auto-annotate Playwright interactions in the recording. */
  showActions?: boolean | ShowActionsConfig;
  /** Capture a JPEG per scene mark for the preview scrubber. Default: true. */
  sceneThumbnails?: boolean;
  /** Capture all frames as JPEGs and stitch in post for higher quality. */
  captureMode?: 'webm' | 'jpeg-stitch';
  /** JPEG quality 0-100. Used by jpeg-stitch mode. */
  jpegQuality?: number;
}

export interface RecordResult {
  videoPath: string;
  timingPath: string;
}

function createPlaywrightConfig(demoName: string, options: RecordOptions, outputDir: string): string {
  const demosDir = path.resolve(options.demosDir);
  const { width, height } = options.video;
  const browser = options.browser ?? 'chromium';
  const deviceScaleFactor = normalizeDeviceScaleFactor(options.deviceScaleFactor);

  // Build optional context options (isMobile, hasTouch, colorScheme, etc.)
  const extraUseFields: string[] = [];
  if (options.isMobile) extraUseFields.push(`        isMobile: true,`);
  if (options.hasTouch) extraUseFields.push(`        hasTouch: true,`);
  if (options.contextOptions) {
    for (const [key, value] of Object.entries(options.contextOptions)) {
      extraUseFields.push(`        ${key}: ${JSON.stringify(value)},`);
    }
  }
  const extraUse = extraUseFields.length > 0 ? '\n' + extraUseFields.join('\n') : '';

  // Chromium's CDP screencast captures JPEGs at viewport CSS pixels regardless
  // of `deviceScaleFactor` (Page.startScreencast caps at viewport, not at the
  // emulated device pixel ratio). The `--force-device-scale-factor` launch flag
  // pins the renderer's native DPR so screencast frames come out at true 2x/3x
  // resolution — required for supersampled lanczos downscale in export.
  const needsDpiFlag = browser === 'chromium' && deviceScaleFactor > 1;
  const launchOptionsField = needsDpiFlag
    ? `\n        launchOptions: { args: ['--force-device-scale-factor=${deviceScaleFactor}'] },`
    : '';

  // Recording is driven by `narration.startRecording(page)` which calls
  // page.screencast.start() at the first scene — no Playwright recordVideo here.
  return `import { defineConfig } from '@playwright/test';

export default defineConfig({
  preserveOutput: 'always',
  outputDir: ${JSON.stringify(outputDir)},
  projects: [
    {
      name: 'demos',
      testDir: ${JSON.stringify(demosDir)},
      testMatch: ${JSON.stringify(`${demoName}.demo.ts`)},
      use: {
        headless: ${options.headed ? 'false' : 'true'},
        browserName: ${JSON.stringify(browser)},
        baseURL: ${JSON.stringify(options.baseURL)},
        viewport: { width: ${width}, height: ${height} },
        deviceScaleFactor: ${deviceScaleFactor},${extraUse}${launchOptionsField}
        video: 'off',
        trace: 'off',
      },
    },
  ],
});
`;
}

export async function record(demoName: string, options: RecordOptions): Promise<RecordResult> {
  const argoDir = path.join('.argo', options.argoSubdir ?? demoName);
  mkdirSync(argoDir, { recursive: true });

  // jpeg-stitch produces an H.264 intermediate (libx264 isn't valid in webm).
  // Use .mp4 there so the final export pipeline reads the right container.
  const videoExt = options.captureMode === 'jpeg-stitch' ? '.mp4' : '.webm';
  const videoPath = path.join(argoDir, `video${videoExt}`);
  const timingPath = path.join(argoDir, '.timing.json');
  const testResultsDir = path.resolve('test-results');
  const recordConfigPath = path.join(argoDir, 'playwright.record.config.mjs');

  writeFileSync(recordConfigPath, createPlaywrightConfig(demoName, options, testResultsDir), 'utf-8');

  // Clean test-results to avoid picking up stale videos
  rmSync(testResultsDir, { recursive: true, force: true });

  // Start asset server if overlay manifest has image assets
  let assetServer: AssetServer | undefined;
  const overlayManifestPath = path.join(options.demosDir, `${demoName}.scenes.json`);
  try {
    const overlayEntries = await loadOverlayManifest(overlayManifestPath);
    if (overlayEntries && hasImageAssets(overlayEntries)) {
      const assetDir = path.join(options.demosDir, 'assets');
      assetServer = await startAssetServer(assetDir);
    }
  } catch (err) {
    // A malformed overlay manifest should not block recording —
    // overlays are rendered by explicit showOverlay()/withOverlay() calls in the demo script,
    // not from the manifest. Only warn.
    console.warn(`Warning: could not parse overlay manifest: ${(err as Error).message}`);
  }

  // Progress file for live scene status during recording
  const progressPath = path.join(argoDir, '.scene-progress.jsonl');
  if (existsSync(progressPath)) unlinkSync(progressPath);

  // Stale live-frame from a previous run would mislead polling clients
  // (preview "Re-record" button) — drop it.
  const liveFramePath = path.join(argoDir, '.live-frame.jpg');
  if (existsSync(liveFramePath)) unlinkSync(liveFramePath);

  try {
    return await new Promise<RecordResult>((resolve, reject) => {
      // Poll the progress file to print scene names as they're recorded
      const seenScenes = new Set<string>();
      const progressPoll = setInterval(() => {
        try {
          if (!existsSync(progressPath)) return;
          const lines = readFileSync(progressPath, 'utf-8').trim().split('\n');
          for (const line of lines) {
            if (!line) continue;
            const { scene } = JSON.parse(line);
            if (scene && !seenScenes.has(scene)) {
              seenScenes.add(scene);
              console.log(`    🎯 ${scene}`);
            }
          }
        } catch { /* best-effort */ }
      }, 500);

      // Encode showActions as JSON when set so the runtime can pass it straight
      // through to page.screencast.showActions(). Empty string means "off".
      let showActionsEnv = '';
      if (options.showActions === true) {
        showActionsEnv = '{}';
      } else if (options.showActions && typeof options.showActions === 'object') {
        showActionsEnv = JSON.stringify(options.showActions);
      }

      // Per-scene thumbs: default ON. Pass '0' to opt out, anything else (including '') means on.
      const sceneThumbsEnv = options.sceneThumbnails === false ? '0' : '1';
      const thumbsDir = path.resolve(path.join(argoDir, 'thumbs'));
      mkdirSync(thumbsDir, { recursive: true });

      // jpeg-stitch mode: every onFrame is persisted as a sequenced JPEG,
      // then stitched in post by the pipeline. Cleared at start of each run
      // so the sequence numbers always reflect the current recording.
      const useJpegStitch = options.captureMode === 'jpeg-stitch';
      const framesDir = useJpegStitch ? path.resolve(path.join(argoDir, 'frames')) : '';
      if (framesDir) {
        rmSync(framesDir, { recursive: true, force: true });
        mkdirSync(framesDir, { recursive: true });
      }
      const jpegQuality = String(options.jpegQuality ?? 95);

      execFile('npx', ['playwright', 'test', '--config', recordConfigPath, '--grep', demoName, '--project', 'demos'], {
        env: {
          ...process.env,
          ARGO_DEMO_NAME: demoName,
          ARGO_OUTPUT_DIR: path.resolve(argoDir),
          ARGO_PROGRESS_PATH: progressPath,
          ARGO_SCREENCAST_PATH: path.resolve(videoPath),
          ARGO_SCREENCAST_WIDTH: String(options.video.width * normalizeDeviceScaleFactor(options.deviceScaleFactor)),
          ARGO_SCREENCAST_HEIGHT: String(options.video.height * normalizeDeviceScaleFactor(options.deviceScaleFactor)),
          ARGO_SHOW_ACTIONS: showActionsEnv,
          ARGO_SCENE_THUMBS: sceneThumbsEnv,
          ARGO_THUMBS_DIR: thumbsDir,
          ARGO_LIVE_FRAME_PATH: path.resolve(path.join(argoDir, '.live-frame.jpg')),
          ARGO_FRAMES_DIR: framesDir,
          ARGO_JPEG_QUALITY: jpegQuality,
          BASE_URL: options.baseURL,
          ARGO_ASSET_URL: assetServer?.url ?? '',
          ARGO_AUTO_BACKGROUND: options.autoBackground ? '1' : '',
          ARGO_DEFAULT_PLACEMENT: options.defaultPlacement ?? '',
          ARGO_ALLOW_RAW_GSAP: options.allowRawGsap ? '1' : '',
          ARGO_SCENE_DURATIONS_PATH: path.resolve(path.join('.argo', demoName, '.scene-durations.json')),
          ARGO_OVERLAYS_PATH: path.resolve(path.join(options.demosDir, `${demoName}.scenes.json`)),
        },
      }, (error, stdout, stderr) => {
        clearInterval(progressPoll);
        // When DEBUG env vars are set (e.g., DEBUG=pw:api), forward Playwright's
        // debug output to stderr so users can see it even on success.
        if (process.env.DEBUG && stderr) {
          process.stderr.write(stderr);
        }
        if (error) {
          const output = [stdout, stderr].filter(Boolean).join('\n');
          reject(new Error(`Playwright recording failed:\n${output}`));
          return;
        }

        // narration.startRecording() wrote the screencast directly to videoPath.
        // If it's missing, the demo never called startRecording() — fail loudly.
        if (!existsSync(videoPath)) {
          reject(new Error(
            `No screencast recording found at ${videoPath}. ` +
            `Ensure the demo calls 'await narration.startRecording(page)' before the first 'narration.mark()'.`
          ));
          return;
        }

        // Verify timing file was written by the narration fixture
        if (!existsSync(timingPath)) {
          reject(new Error(
            `No timing file found at ${timingPath}. ` +
            `Ensure the demo uses the argo test fixture with narration.mark() calls.`
          ));
          return;
        }

        resolve({ videoPath, timingPath });
      });
    });
  } finally {
    if (assetServer) await assetServer.close();
  }
}
