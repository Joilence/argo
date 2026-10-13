import { type Placement, type SceneTiming } from './tts/align.js';
export interface SceneManifestEntry {
    scene: string;
    text?: string;
    voice?: string;
    speed?: number;
    lang?: string;
    [key: string]: unknown;
}
/**
 * Where a demo's scene manifest lives, for the base demo or for one language.
 *
 * Language manifests sit in a `locales/` subdirectory rather than beside the
 * base one, because `discoverDemos` treats every `*.scenes.json` in `demosDir`
 * as a demo: a sibling `checkout.de.scenes.json` would register as a phantom
 * demo named `checkout.de` whose `.demo.ts` does not exist, and `--all` would
 * then fail on it.
 *
 * There is deliberately no fallback to the base manifest. A missing translation
 * would otherwise narrate the demo in the source language while every other
 * artifact of the run claimed it was localised.
 */
export declare function resolveManifestPath(demosDir: string, demoName: string, lang?: string): string;
/** The `.argo` subdirectory for a run, which is per language so that clips, timings and word transcripts of two locales cannot be crossed. */
export declare function resolveArgoSubdir(demoName: string, lang?: string): string;
/**
 * The basename a run's artifacts are written under in `outputDir`.
 *
 * Dot-separated, matching the existing `<demo>.<variant>.srt` and `.vtt`
 * sidecars. Note this does not match the variant *video*, which README
 * documents as `<demo>-<variant>.mp4`: upstream already spells the two
 * conventions differently and this follows the sidecar one.
 *
 * Without a distinct name a language run overwrites the base demo's video,
 * subtitles and metadata, which is silent: the files are the right shape and
 * describe a different recording.
 */
export declare function resolveOutputName(demoName: string, lang?: string): string;
/**
 * Reject a language tag that cannot safely be spliced into a path.
 *
 * `lang` reaches `join(demosDir, 'locales', ...)` on the read side and a
 * `mkdirSync` under `.argo/` on the write side, so an unchecked `../../..`
 * both reads outside the demos directory and writes outside `.argo`:
 * `lang = '../../../../tmp/pwn'` resolves to `../tmp/pwn` and `../tmp/pwn.mp4`.
 * Region subtags are legal, which is why this is not simply alphanumeric.
 *
 * Called by the three resolvers above rather than only at the CLI, because
 * `runPipeline` and `PipelineOptions` are exported from `src/index.ts` while
 * this is not: a library caller could not apply the check even knowing it
 * existed, and a future `--lang` on `export` or `validate` would have to
 * remember to. Guarding where the value is consumed cannot be forgotten.
 */
export declare function assertValidLang(lang: string): void;
export declare function readScenesManifest(manifestPath: string): SceneManifestEntry[];
export declare function buildSceneTexts(entries: SceneManifestEntry[]): Record<string, string>;
export declare function buildSceneDurationsFromCache(demoName: string, entries: SceneManifestEntry[], defaults: {
    voice?: string;
    speed?: number;
}, projectRoot?: string): Record<string, number>;
export declare function computeHeadTrimMs(timing: SceneTiming, leadInMs?: number, minTrimMs?: number): number;
export declare function buildPlacementsFromTimingAndDurations(timing: SceneTiming, sceneDurations: Record<string, number>, totalDurationMs: number): Placement[];
export declare function shiftPlacements(placements: Placement[], offsetMs: number): Placement[];
//# sourceMappingURL=timeline.d.ts.map