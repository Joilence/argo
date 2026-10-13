/**
 * TTS clip generation with manifest parsing and cache integration.
 */
import fs from 'node:fs';
import { parseWavHeader } from './engine.js';
import { ClipCache } from './cache.js';
import { transcribeWav, warmTranscriber, DEFAULT_WHISPER_MODEL } from './transcribe.js';
export async function generateClips(options) {
    const { manifestPath, demoName, engine, projectRoot, defaults } = options;
    // Clips and transcripts are addressed by the run's own subdirectory, not by
    // the demo, so two audio tracks of one demo stay apart.
    const argoSubdir = options.argoSubdir ?? demoName;
    // 1. Check manifest exists
    if (!fs.existsSync(manifestPath)) {
        throw new Error(`Manifest file not found: ${manifestPath}`);
    }
    // 2. Read and parse JSON
    let rawEntries;
    try {
        const content = fs.readFileSync(manifestPath, 'utf-8');
        rawEntries = JSON.parse(content);
    }
    catch (err) {
        if (err instanceof SyntaxError) {
            throw new Error(`Failed to parse manifest ${manifestPath}: ${err.message}`);
        }
        throw err;
    }
    if (!Array.isArray(rawEntries)) {
        throw new Error(`Manifest ${manifestPath} must contain a JSON array`);
    }
    // 3. Validate entries — scene is required, text is optional (empty = silent scene)
    for (const entry of rawEntries) {
        const e = entry;
        if (typeof e.scene !== 'string') {
            throw new Error('Manifest entry missing required field: scene is required');
        }
    }
    const cache = new ClipCache(projectRoot);
    // Build manifest entries with defaults (skip entries with empty text for silent scenes)
    const entries = rawEntries
        .filter((raw) => {
        const r = raw;
        return typeof r.text === 'string' && r.text.trim().length > 0;
    })
        .map((raw) => {
        const r = raw;
        const entry = {
            scene: r.scene,
            text: r.text,
            voice: r.voice ?? defaults?.voice,
            speed: r.speed ?? defaults?.speed,
            lang: r.lang,
        };
        return { entry, clipPath: cache.getClipPath(argoSubdir, entry) };
    });
    // Log per-scene status and generate uncached clips sequentially —
    // Kokoro's ONNX runtime is not safe for concurrent generate() calls.
    for (const { entry } of entries) {
        if (cache.isCached(argoSubdir, entry)) {
            console.log(`  ▸ ${entry.scene} (cached)`);
        }
        else {
            process.stdout.write(`  ▸ ${entry.scene} (generating...)`);
            const wavBuffer = await engine.generate(entry.text, {
                voice: entry.voice,
                speed: entry.speed,
                lang: entry.lang,
            });
            cache.cacheClip(argoSubdir, entry, wavBuffer);
            process.stdout.write(' done\n');
        }
    }
    // Optional Step 4: per-clip word-level transcription via Whisper. Runs
    // sequentially after audio is fully cached so the transcriber model
    // load happens once and is shared across clips.
    const transcribeConfig = normalizeTranscribeConfig(options.transcribe);
    const transcripts = new Map();
    if (transcribeConfig && entries.length > 0) {
        const model = transcribeConfig.model ?? DEFAULT_WHISPER_MODEL;
        console.log(`✍️  Transcribing for word timestamps (${model})...`);
        let warmed = false;
        for (const { entry, clipPath } of entries) {
            const transcriptPath = cache.getTranscriptPath(argoSubdir, entry, model);
            if (cache.isTranscriptCached(argoSubdir, entry, model)) {
                console.log(`  ▸ ${entry.scene} (cached)`);
                const words = JSON.parse(fs.readFileSync(transcriptPath, 'utf-8'));
                transcripts.set(entry.scene, { words, path: transcriptPath });
                continue;
            }
            // Pre-warm only on first cache miss — saves the model-download cost
            // entirely when every clip is already transcribed.
            if (!warmed) {
                await warmTranscriber(model);
                warmed = true;
            }
            process.stdout.write(`  ▸ ${entry.scene} (transcribing...)`);
            try {
                const words = await transcribeWav(clipPath, {
                    model,
                    language: transcribeConfig.language ?? entry.lang,
                });
                fs.writeFileSync(transcriptPath, JSON.stringify(words, null, 2));
                transcripts.set(entry.scene, { words, path: transcriptPath });
                process.stdout.write(' done\n');
            }
            catch (err) {
                // Transcription is best-effort — never fail the pipeline because
                // Whisper choked on a clip.
                process.stdout.write(' failed\n');
                console.warn(`  Whisper failed for "${entry.scene}": ${err.message}`);
            }
        }
    }
    // Read results (all clips now cached)
    return entries.map(({ entry, clipPath }) => {
        const wavBuf = fs.readFileSync(clipPath);
        const { durationMs } = parseWavHeader(wavBuf);
        const t = transcripts.get(entry.scene);
        return {
            scene: entry.scene,
            clipPath,
            durationMs,
            wordTimings: t?.words,
            transcriptPath: t?.path,
        };
    });
}
function normalizeTranscribeConfig(cfg) {
    if (!cfg)
        return null;
    if (cfg === true)
        return {};
    return cfg;
}
//# sourceMappingURL=generate.js.map