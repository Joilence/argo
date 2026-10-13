/**
 * Run ffmpeg with progress reporting.
 *
 * Uses `-progress pipe:1` to parse progress output and display a
 * terminal progress bar showing encode percentage.
 */
export declare function runFfmpegWithProgress(args: string[], totalDurationMs?: number): Promise<void>;
//# sourceMappingURL=progress.d.ts.map