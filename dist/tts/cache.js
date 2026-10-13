/**
 * Content-addressed clip cache for Argo TTS output.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
export class ClipCache {
    projectRoot;
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }
    /**
     * Returns the full file path for a cached clip.
     */
    getClipPath(demoName, entry) {
        const hash = this.computeHash(entry);
        return path.join(this.projectRoot, '.argo', demoName, 'clips', `${hash}.wav`);
    }
    /**
     * Returns the full file path for a cached transcript (word-level
     * timestamps from Whisper). Lives next to the audio clip and shares
     * its content hash so clip cache hits ride along — but folds the
     * Whisper model id into the filename so swapping models doesn't bust
     * the (much more expensive) audio cache.
     */
    getTranscriptPath(demoName, entry, model) {
        const hash = this.computeHash(entry);
        const modelTag = sanitizeModelId(model);
        return path.join(this.projectRoot, '.argo', demoName, 'clips', `${hash}.${modelTag}.transcript.json`);
    }
    /**
     * Checks whether a clip is already cached on disk.
     */
    isCached(demoName, entry) {
        return fs.existsSync(this.getClipPath(demoName, entry));
    }
    /** Whether a transcript for this clip+model pair is already cached. */
    isTranscriptCached(demoName, entry, model) {
        return fs.existsSync(this.getTranscriptPath(demoName, entry, model));
    }
    /**
     * Returns the cached WAV buffer, or null if not cached.
     */
    getCachedClip(demoName, entry) {
        const clipPath = this.getClipPath(demoName, entry);
        if (!fs.existsSync(clipPath)) {
            return null;
        }
        return fs.readFileSync(clipPath);
    }
    /**
     * Writes a WAV buffer to the cache, creating directories as needed.
     */
    cacheClip(demoName, entry, wavBuffer) {
        const clipPath = this.getClipPath(demoName, entry);
        fs.mkdirSync(path.dirname(clipPath), { recursive: true });
        fs.writeFileSync(clipPath, wavBuffer);
    }
    computeHash(entry) {
        const { scene, text, voice, speed, lang } = entry;
        return crypto
            .createHash('sha256')
            .update(JSON.stringify({ scene, text, voice, speed, lang }))
            .digest('hex');
    }
}
/** Make a Hugging Face model id safe to embed in a filename — strip the
 *  org slash and any other non-word chars. `onnx-community/whisper-base.en`
 *  → `onnx-community-whisper-base-en`. Preserves enough that it remains
 *  human-readable when ls'ing the clips dir. */
function sanitizeModelId(model) {
    return model.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
//# sourceMappingURL=cache.js.map