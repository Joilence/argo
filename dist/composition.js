// renderComposition — embed a self-contained HTML composition as an Argo scene.
//
// Composition contract (mirrors hyperframes' shape so a composition that runs
// in hyperframes runs unchanged in Argo):
//
//   * Root element: <div data-composition-id="X" data-width="..."
//                        data-height="..." data-duration="...">
//   * (optional) `window.__compositionReady` — a Promise that resolves when
//     fonts/timeline/assets are ready. renderComposition awaits it before
//     marking the scene.
//   * (optional) `window.__timelines[<scene>]` — a paused GSAP master
//     timeline. renderComposition calls `.play()` after marking the scene.
//
// Argo additions on top of the hyperframes contract:
//
//   * `window.__argoVideoSrc` — set by renderComposition via addInitScript
//     when `opts.videoSrc` is provided. Compositions that wrap a recording
//     (e.g. a 3D device frame around an Argo mp4) read this to embed a
//     `<video>` child for html-in-canvas texturing.
//
// The composition file is loaded via `page.goto('file://...')` so relative
// asset paths (textures, GLTF models, fonts) resolve normally — `setContent`
// with embedded HTML breaks every external reference.
import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { startCompositionServer } from './composition-server.js';
export async function renderComposition(page, narration, htmlPath, opts) {
    if (!existsSync(htmlPath)) {
        throw new Error(`renderComposition: composition file not found: ${htmlPath}`);
    }
    // Inject videoSrc BEFORE navigation. addInitScript fires on every load —
    // we revoke after this scene completes so subsequent navigations in the
    // demo don't keep the global set.
    if (opts.videoSrc) {
        await page.addInitScript((src) => {
            window.__argoVideoSrc = src;
        }, opts.videoSrc);
    }
    // Spin up a per-scene HTTP server rooted at the project (composition's
    // grandparent) so relative refs from inside the composition reach sibling
    // directories at the root (e.g. `compositions/foo.html` loading
    // `models/bar.glb`). file:// URLs hit chromium's CORS-on-file gating
    // even with --allow-file-access-from-files for asset types like GLTF.
    const compAbs = resolve(htmlPath);
    const root = opts.serverRoot ?? dirname(dirname(compAbs));
    const server = await startCompositionServer(root, compAbs);
    try {
        await page.goto(server.url, { waitUntil: 'load' });
        // Await composition's readiness signal (best-effort — compositions
        // without one are just considered ready when `load` fires).
        const readyTimeoutMs = opts.readyTimeoutMs ?? 8000;
        await page.evaluate((timeoutMs) => {
            const ready = window.__compositionReady;
            if (!(ready instanceof Promise))
                return undefined;
            return Promise.race([
                ready,
                new Promise((_, reject) => setTimeout(() => reject(new Error('composition __compositionReady timed out')), timeoutMs)),
            ]);
        }, readyTimeoutMs);
        // Resolve duration: explicit override > composition's data-duration > 5s default.
        const declared = await page.evaluate((sceneId) => {
            const compRoot = document.querySelector(`[data-composition-id="${sceneId}"]`)
                ?? document.querySelector('[data-composition-id]');
            const v = compRoot?.getAttribute('data-duration');
            return v ? Number(v) * 1000 : null;
        }, opts.scene);
        const durationMs = opts.durationMs ?? declared ?? 5000;
        // Poll for timeline registration BEFORE marking the scene. Many
        // hyperframes blocks register `window.__timelines[scene]` AFTER async
        // GLTF/asset/DRACO loads complete (10-12s of browser warmup). Marking
        // the scene first and polling second burns that warmup as visually
        // blank scene time. Mark after the timeline is ready so the scene's
        // first frame is the composition's first animated frame.
        await page.evaluate(({ sceneId, pollMs }) => {
            return new Promise((resolve) => {
                const deadline = performance.now() + pollMs;
                const tick = () => {
                    const tls = window.__timelines;
                    const target = tls?.[sceneId];
                    const hasAny = tls && Object.keys(tls).length > 0;
                    if (target?.play || hasAny) {
                        resolve();
                        return;
                    }
                    if (performance.now() > deadline) {
                        resolve();
                        return;
                    }
                    setTimeout(tick, 50);
                };
                tick();
            });
        }, { sceneId: opts.scene, pollMs: readyTimeoutMs });
        const host = narration;
        if (!host.isRecording) {
            await host.startRecording(page);
        }
        narration.mark(opts.scene);
        // Crossover audio: hyperframes blocks bring sound effects (sfx-production.wav,
        // background music tracks, etc.) as <audio> children that play on the GSAP
        // timeline. CDP screencast captures video only — audio output is invisible
        // to Argo's recording engine. To get the composition's audio into the
        // final mp4, register each <audio src> with a sidecar manifest the
        // pipeline reads at mix time. Paths are relative to serverRoot (which
        // matches the on-disk project layout when compositions live in
        // `compositions/`), so the pipeline can resolve them as project-root paths.
        //
        // v1 approximation: assume all <audio> elements play from the scene's
        // start. A future version could instrument HTMLAudioElement.prototype.play
        // to record actual play timestamps. Most hyperframes blocks fire their
        // SFX as the timeline kicks off, so this is usually right.
        const argoOutputDir = process.env.ARGO_OUTPUT_DIR;
        if (argoOutputDir) {
            const audioRefs = await page.evaluate(() => {
                const seen = new Set();
                const refs = [];
                document.querySelectorAll('audio').forEach((a) => {
                    const direct = a.getAttribute('src');
                    const fromSource = a.querySelector('source')?.getAttribute('src') ?? null;
                    const src = direct || fromSource;
                    if (src && !seen.has(src)) {
                        seen.add(src);
                        refs.push({ src });
                    }
                });
                return refs;
            });
            if (audioRefs.length > 0) {
                const sidecar = join(argoOutputDir, '.composition-audio.jsonl');
                const startMs = narration.getTimings()[opts.scene] ?? 0;
                for (const ref of audioRefs) {
                    // src is browser-relative (from a page served with <base href="/">,
                    // i.e. effectively project-root-relative). Resolve to absolute path
                    // via serverRoot so the pipeline can read the file directly.
                    const absSrc = resolve(root, ref.src.replace(/^\/+/, ''));
                    appendFileSync(sidecar, JSON.stringify({ scene: opts.scene, src: absSrc, startMs, durationMs }) + '\n');
                }
            }
        }
        // Resume the registered timeline. Look up by scene name, fall back to
        // playing all registered timelines (compositions with a single master).
        await page.evaluate((sceneId) => {
            const tls = window.__timelines;
            if (!tls)
                return;
            if (tls[sceneId]?.play) {
                tls[sceneId].play();
            }
            else {
                for (const tl of Object.values(tls)) {
                    if (tl?.play)
                        tl.play();
                }
            }
        }, opts.scene);
        await page.waitForTimeout(durationMs);
    }
    finally {
        await server.close();
    }
}
/**
 * Read a composition's declared duration from its `data-duration` attribute
 * without rendering it. Useful in `narration.durationFor()` callsites that
 * need the duration before the page navigates to the composition.
 */
export function readCompositionDuration(htmlPath) {
    if (!existsSync(htmlPath))
        return null;
    const html = readFileSync(htmlPath, 'utf-8');
    const match = html.match(/data-duration=["'](\d+(?:\.\d+)?)["']/);
    return match ? Math.round(Number(match[1]) * 1000) : null;
}
//# sourceMappingURL=composition.js.map