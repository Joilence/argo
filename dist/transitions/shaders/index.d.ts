export declare const SHADER_NAMES: readonly ["crosswarp", "swirl", "ripple", "luma-mask", "light-leak", "domain-warp", "ridged-burn", "thermal-distortion", "swirl-vortex", "whip-pan", "gravitational-lens", "cinematic-zoom", "chromatic-split", "flash-through-white", "sdf-iris", "ripple-waves"];
export type ShaderName = (typeof SHADER_NAMES)[number];
export declare const SHADERS: Record<ShaderName, string>;
export declare function isValidShaderName(name: string): name is ShaderName;
//# sourceMappingURL=index.d.ts.map