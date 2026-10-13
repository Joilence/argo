export interface CompositionServer {
    /** URL of the composition entry point (HTML with <base href="/"> injected). */
    url: string;
    port: number;
    close: () => Promise<void>;
}
export declare function startCompositionServer(rootDir: string, compositionPath: string): Promise<CompositionServer>;
//# sourceMappingURL=composition-server.d.ts.map