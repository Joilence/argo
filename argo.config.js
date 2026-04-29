export default {
  baseURL: process.env.BASE_URL || 'https://news.ycombinator.com',
  demosDir: 'demos/',
  outputDir: 'videos/',
  video: {
    width: 1920,
    height: 1080,
    fps: 30,
    browser: 'webkit',
    // EXPERIMENT (feat/jpeg-stitch branch): capture every frame as a high-
    // quality JPEG and stitch in post with libx264, instead of the engine's
    // VP8 WebM. Higher per-frame quality, costs ~180 MB/min of intermediates.
    captureMode: 'jpeg-stitch',
    jpegQuality: 95,
    // For flagship showcase / landing-page exports on a 5K display, switch to:
    // width: 3840,
    // height: 2160,
    // deviceScaleFactor: 1,
  },
  export: { thumbnailPath: 'assets/logo-thumb.png' },
};
