import type { Placement } from './tts/align.js';
/**
 * Generate ffmpeg metadata format for chapter markers.
 * Each scene placement becomes a chapter in the MP4.
 */
export declare function generateChapterMetadata(placements: Placement[], totalDurationMs: number): string;
//# sourceMappingURL=chapters.d.ts.map