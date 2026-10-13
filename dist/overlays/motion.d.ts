import type { MotionPreset } from './types.js';
/**
 * CSS keyframe rule for a named motion preset. GSAP motions return an empty
 * string — GSAP applies its own inline styles at runtime via `runGsapMotion`.
 */
export declare function getMotionCSS(motion: MotionPreset, elementId: string): string;
export declare function getMotionStyles(motion: MotionPreset, elementId: string): Record<string, string>;
//# sourceMappingURL=motion.d.ts.map