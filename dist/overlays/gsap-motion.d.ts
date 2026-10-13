/**
 * GSAP-driven overlay motion. Declarative subset of GSAP tweens with an opt-in
 * `raw` escape hatch. Types live here; the browser-side runtime lives in
 * `gsap-runtime.ts`.
 */
export declare const GSAP_EASES: readonly ["none", "linear", "power1.in", "power1.out", "power1.inOut", "power2.in", "power2.out", "power2.inOut", "power3.in", "power3.out", "power3.inOut", "power4.in", "power4.out", "power4.inOut", "back.in", "back.out", "back.inOut", "elastic.in", "elastic.out", "elastic.inOut", "bounce.in", "bounce.out", "bounce.inOut", "expo.in", "expo.out", "expo.inOut", "circ.in", "circ.out", "circ.inOut", "sine.in", "sine.out", "sine.inOut"];
export type GsapEase = (typeof GSAP_EASES)[number];
export declare const GSAP_VAR_KEYS: readonly ["x", "y", "z", "scale", "scaleX", "scaleY", "rotation", "rotationX", "rotationY", "skewX", "skewY", "opacity", "filter", "width", "height", "top", "left", "right", "bottom", "background", "backgroundColor", "color", "borderRadius", "transformOrigin"];
export type GsapVarKey = (typeof GSAP_VAR_KEYS)[number];
export type GsapVars = Partial<Record<GsapVarKey, string | number>>;
export interface GsapTween {
    from?: GsapVars;
    to?: GsapVars;
    fromTo?: {
        from: GsapVars;
        to: GsapVars;
    };
    /** Seconds. Default 0.4. */
    duration?: number;
    /** Seconds. */
    delay?: number;
    ease?: GsapEase;
    /** Seconds — stagger between elements when `target` matches multiple. */
    stagger?: number;
    /** CSS selector inside the overlay container. Default: the container itself. */
    target?: string;
    /** Only meaningful for `loop`. Use -1 for infinite. */
    repeat?: number;
    /** Only meaningful for `loop`. */
    yoyo?: boolean;
}
export interface GsapMotion {
    type: 'gsap';
    in?: GsapTween;
    out?: GsapTween;
    loop?: GsapTween;
    /** Raw GSAP code. Gated by config `overlays.allowRawGsap`. Executed as
     *  `new Function('gsap', 'root', raw)` against the overlay container. */
    raw?: string;
}
export declare function isGsapMotion(motion: unknown): motion is GsapMotion;
export declare function isValidGsapEase(value: string): value is GsapEase;
export declare function isValidGsapVarKey(value: string): value is GsapVarKey;
export interface GsapValidationError {
    path: string;
    message: string;
}
export interface GsapValidateOptions {
    allowRaw?: boolean;
}
/** Validate a GsapMotion. Returns an array of errors; empty array means OK. */
export declare function validateGsapMotion(motion: GsapMotion, opts?: GsapValidateOptions): GsapValidationError[];
/** Compute the seconds a tween will occupy on the wall clock (duration + delay). */
export declare function tweenWallMs(tween: GsapTween | undefined): number;
//# sourceMappingURL=gsap-motion.d.ts.map