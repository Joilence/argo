import type { Page } from '@playwright/test';
export declare function resolveBlocksDir(explicit?: string): string;
export interface ApplyComponentOptions {
    /** CSS custom property overrides, e.g. { '--vignette-size': '40%' }. */
    params?: Record<string, string>;
    /** Override the blocks directory (defaults to ARGO_BLOCKS_DIR or 'blocks'). */
    blocksDir?: string;
}
/**
 * Inject an installed hyperframes component (full-frame, pointer-events:
 * none) into the recorded page. Persists until removeComponent() - pair
 * them, or use the `hf-component` overlay cue for duration-based display.
 */
export declare function applyComponent(page: Page, name: string, opts?: ApplyComponentOptions): Promise<void>;
/** Remove an applied component and its params/styles. */
export declare function removeComponent(page: Page, name: string): Promise<void>;
//# sourceMappingURL=apply-component.d.ts.map