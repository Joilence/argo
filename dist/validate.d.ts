export interface ValidateOptions {
    demoName: string;
    demosDir: string;
    /** Mirrors config `overlays.allowRawGsap`. When true, `motion.raw` is accepted. */
    allowRawGsap?: boolean;
    /** Directory holding installed hyperframes items (config.blocksDir). Default 'blocks'. */
    blocksDir?: string;
    /** Mirrors config `export.transition.accent` — validated as 6-digit hex when set. */
    transitionAccent?: string;
}
export interface ValidateResult {
    errors: string[];
    warnings: string[];
}
export declare function validateDemo(options: ValidateOptions): Promise<ValidateResult>;
//# sourceMappingURL=validate.d.ts.map