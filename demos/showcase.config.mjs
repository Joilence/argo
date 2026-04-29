import { defineConfig } from '@argo-video/cli';

export default defineConfig({
  baseURL: 'http://127.0.0.1:8976',
  demosDir: 'demos',
  outputDir: 'videos',
  tts: { defaultVoice: 'af_heart', defaultSpeed: 1.0 },
  video: {
    width: 1920,
    height: 1080,
    fps: 30,
    browser: 'chromium',
    // 2x DPI capture — page renders at 3840×2160, export downscales with lanczos.
    // Requires --force-device-scale-factor flag (auto-applied by record.ts) so the
    // CDP screencast actually delivers 4K JPEGs (without the flag, screencast caps
    // at viewport CSS pixels regardless of DPR).
    deviceScaleFactor: 2,
    // EXPERIMENT (feat/jpeg-stitch): capture all frames as high-quality JPEGs
    // and stitch in post with libx264 — bypasses the engine's VP8 encoder.
    captureMode: 'jpeg-stitch',
    jpegQuality: 95,
  },
  export: {
    preset: 'slow',
    crf: 23,
    transition: { type: 'shader', shader: 'crosswarp', durationMs: 1200 },
    // speedRamp: { gapSpeed: 2.0, minGapMs: 600 },  // disabled for now — conflicts with transitions
    // formats: ['gif'],  // too long for GIF — use argo clip for scene-level GIFs
    audio: { loudnorm: true },
    watermark: {
      src: 'assets/logo-watermark.png',
      position: 'bottom-right',
      opacity: 0.16,
      margin: 26,
    },
    // A/B test: CAS sharpen disabled to check if it's amplifying soft JPEG edges
    // into halos (the "water on paper" wash). Re-enable once verified.
    sharpen: false,
    // Frame: wrap the recording in a styled frame with padding, rounded corners,
    // drop shadow, and a gradient background (the "Screen Studio" look).
    frame: {
      padding: 48,
      borderRadius: 16,
      shadow: 0.32,
      background: { type: 'gradient', value: 'linear-gradient(135deg, #1a1a2e, #16213e)' },
    },
    // Motion blur: time-gated to zoom-in/zoom-out intervals via ffmpeg enable expressions.
    motionBlur: { intensity: 0.5 },
    // variants: [
    //   { name: 'vertical', video: { width: 1080, height: 1920 } },
    //   { name: 'square',   video: { width: 1080, height: 1080 } },
    // ],
  },
  overlays: {
    autoBackground: true,
  },
});
