// Argo — Playwright demo recording with AI voiceover
// Config
export { defineConfig, loadConfig, demosProject, } from './config.js';
// Fixtures
export { test, expect, demoType } from './fixtures.js';
// Narration
export { NarrationTimeline } from './narration.js';
// Captions
export { showCaption, hideCaption, withCaption } from './captions.js';
// Overlays
export { showOverlay, hideOverlay, withOverlay, } from './overlays/index.js';
// Overlay PNG rendering (for imported videos)
export { renderOverlaysToPng, buildOverlayPngFilters, buildOverlayPngsForImport, isImportedVideo, } from './overlays/render-to-png.js';
// Effects
export { showConfetti } from './effects.js';
// Hyperframes component injection
export { applyComponent, removeComponent, } from './hf/apply-component.js';
// Camera
export { spotlight, focusRing, dimAround, zoomTo, resetCamera, trackCursor, } from './camera.js';
// Cursor
export { cursorHighlight, resetCursor, } from './cursor.js';
// Composition — embed a self-contained HTML composition as an Argo scene.
// Follows hyperframes' contract (data-composition-id + paused master timeline
// + ready signal) so a composition that runs in hyperframes runs unchanged
// in Argo. Argo adds `window.__argoVideoSrc` so compositions can wrap an
// Argo recording (e.g. 3D device frame textured via html-in-canvas).
export { renderComposition, readCompositionDuration, } from './composition.js';
export { engines } from './tts/engines/index.js';
// Subtitles
export { generateSrt, generateVtt } from './subtitles.js';
// Chapters
export { generateChapterMetadata } from './chapters.js';
// Report
export { buildSceneReport, formatSceneReport } from './report.js';
// Validate
export { validateDemo } from './validate.js';
// Doctor
export { runDoctor, formatDoctorResults } from './doctor.js';
// Pipeline
export { runPipeline, runBatchPipeline, discoverDemos } from './pipeline.js';
// Transitions
export { buildTransitionFilters } from './transitions.js';
// Speed Ramp
export { computeSegments, applySpeedRamp } from './speed-ramp.js';
// Freeze
export { buildFreezeFilter, resolveFreezes, adjustPlacementsForFreezes, totalFreezeDurationMs, } from './freeze.js';
// Camera Moves
export { buildCameraMoveFilter, buildMotionBlurFilter, detectChainedPairs, shiftCameraMoves, scaleCameraMoves, remapCameraMoves, exportTimelineRemap } from './camera-move.js';
// Frame
export { buildFrameFilter, generateFramePng } from './frame.js';
// Progress
export { runFfmpegWithProgress } from './progress.js';
// Dashboard
export { startDashboardServer } from './dashboard.js';
// Clip
export { extractClip } from './clip.js';
// Release Prep
export { releasePrep } from './release-prep.js';
// Init
export { init } from './init.js';
// Media utilities
export { getVideoDurationMs, getVideoFrameRate, getVideoDimensions, detectVideoTheme } from './media.js';
// Import
export { importVideo } from './import.js';
// Music Generation
export { generateMusic, generateMusicCached } from './music/musicgen.js';
//# sourceMappingURL=index.js.map