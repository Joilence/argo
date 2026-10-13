/**
 * argo preview (no args) — multi-demo dashboard.
 *
 * Shows a landing page listing all discovered demos with status indicators,
 * thumbnails (if MP4 exists), and links to individual preview pages.
 */
export interface DashboardOptions {
    demosDir: string;
    outputDir: string;
    argoDir?: string;
    port?: number;
    ttsDefaults?: {
        voice: string;
        speed: number;
    };
    exportConfig?: import('./preview.js').PreviewExportConfig;
}
export declare function startDashboardServer(options: DashboardOptions): Promise<{
    url: string;
    close: () => void;
}>;
//# sourceMappingURL=dashboard.d.ts.map