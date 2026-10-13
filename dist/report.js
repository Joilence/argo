export function buildSceneReport(demo, placements, overflowMs, totalDurationMs, outputPath) {
    return {
        demo,
        totalDurationMs,
        overflowMs,
        scenes: placements.map((p) => ({
            scene: p.scene,
            startMs: p.startMs,
            endMs: p.endMs,
            durationMs: p.endMs - p.startMs,
        })),
        output: outputPath,
    };
}
export function formatSceneReport(report) {
    const lines = [];
    lines.push(`Scene report: ${report.demo}`);
    lines.push(`${'─'.repeat(50)}`);
    for (const s of report.scenes) {
        const start = (s.startMs / 1000).toFixed(1).padStart(6);
        const end = (s.endMs / 1000).toFixed(1).padStart(6);
        const dur = (s.durationMs / 1000).toFixed(1).padStart(5);
        lines.push(`  ${s.scene.padEnd(24)} ${start}s → ${end}s  (${dur}s)`);
    }
    lines.push(`${'─'.repeat(50)}`);
    lines.push(`  Total: ${(report.totalDurationMs / 1000).toFixed(1)}s`);
    if (report.overflowMs > 0) {
        lines.push(`  Overflow: ${(report.overflowMs / 1000).toFixed(1)}s (video padded)`);
    }
    lines.push(`  Output: ${report.output}`);
    return lines.join('\n');
}
//# sourceMappingURL=report.js.map