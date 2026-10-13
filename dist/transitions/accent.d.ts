/** RGB triple with components normalized to [0, 1]. */
export type Vec3 = [number, number, number];
export interface AccentColors {
    accent: Vec3;
    accentDark: Vec3;
    accentBright: Vec3;
}
/** Default accent used when `export.transition.accent` is not configured. */
export declare const DEFAULT_ACCENT = "#0ea5e9";
/**
 * Parse a 6-digit hex color and derive the dark/bright variants the ported
 * hyperframes shaders expect (edge glow, burn tinting). Dark is a simple
 * luminance scale; bright mixes toward white.
 */
export declare function deriveAccentColors(hex?: string): AccentColors;
//# sourceMappingURL=accent.d.ts.map