/**
 * Content-addressed clip cache for Argo TTS output.
 */
export interface ManifestEntry {
    scene: string;
    text: string;
    voice?: string;
    speed?: number;
    lang?: string;
}
export declare class ClipCache {
    private readonly projectRoot;
    constructor(projectRoot: string);
    /**
     * Returns the full file path for a cached clip.
     */
    getClipPath(demoName: string, entry: ManifestEntry): string;
    /**
     * Returns the full file path for a cached transcript (word-level
     * timestamps from Whisper). Lives next to the audio clip and shares
     * its content hash so clip cache hits ride along — but folds the
     * Whisper model id into the filename so swapping models doesn't bust
     * the (much more expensive) audio cache.
     */
    getTranscriptPath(demoName: string, entry: ManifestEntry, model: string): string;
    /**
     * Checks whether a clip is already cached on disk.
     */
    isCached(demoName: string, entry: ManifestEntry): boolean;
    /** Whether a transcript for this clip+model pair is already cached. */
    isTranscriptCached(demoName: string, entry: ManifestEntry, model: string): boolean;
    /**
     * Returns the cached WAV buffer, or null if not cached.
     */
    getCachedClip(demoName: string, entry: ManifestEntry): Buffer | null;
    /**
     * Writes a WAV buffer to the cache, creating directories as needed.
     */
    cacheClip(demoName: string, entry: ManifestEntry, wavBuffer: Buffer): void;
    private computeHash;
}
//# sourceMappingURL=cache.d.ts.map