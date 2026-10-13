export type GpuEncoder = 'nvenc' | 'videotoolbox' | 'vaapi' | 'qsv' | null;
/**
 * Probe ffmpeg for a GPU-accelerated H.264 encoder.
 *
 * Detection order (preference): nvenc > videotoolbox > vaapi > qsv.
 * Returns `null` if no GPU encoder is available — caller should fall back
 * to libx264.
 *
 * Result is cached for the process lifetime (including null — ffmpeg's encoder
 * list does not change during a process run). Call `resetGpuEncoderCache()`
 * in tests if you need to re-probe.
 */
export declare function detectGpuEncoder(): Promise<GpuEncoder>;
export declare function resetGpuEncoderCache(): void;
/** Exposed for tests only — returns true once detectGpuEncoder() has probed at least once. */
export declare function isGpuEncoderProbed(): boolean;
/**
 * Map an encoder handle to the ffmpeg codec name.
 * Returns `libx264` when encoder is null (CPU fallback).
 */
export declare function getGpuEncoderName(encoder: GpuEncoder, codec: 'h264'): string;
export type EncoderPreference = 'cpu' | 'gpu';
/**
 * Whether GPU encoding is enabled for this process.
 * Controlled by `ARGO_USE_GPU` env var: unset/`'1'`/`'true'` → enabled,
 * any other value → disabled.
 *
 * Prefer `resolveEncoder()` for new code — it accepts an explicit caller
 * preference so paths like `argo pipeline` (quality-first) and `argo preview`
 * (speed-first) can pick different defaults.
 */
export declare function isGpuEncodingEnabled(): boolean;
/**
 * Resolve the encoder to use for a given export call.
 *
 * Precedence (highest → lowest):
 *   1. `ARGO_USE_GPU` env var ('0'/'false' → cpu, '1'/'true' → gpu) — explicit user override
 *   2. `preference` arg (from `export.encoder` config or call site)
 *   3. `defaultPreference` arg (caller default: pipeline/cli pass 'cpu' for quality,
 *      preview passes 'gpu' for fast iteration)
 *
 * Returns a `GpuEncoder` handle (or `null` for libx264).
 *
 * Why CPU is the default for pipeline/cli: videotoolbox at the default mapping
 * (`100 - crf*2` → q:v 54 at CRF 23) introduces dark-region quantization
 * (visible as watercolor banding on dark backgrounds at 4K source) that
 * libx264 with `aq-mode=3` does not. The 3–5× encode-time penalty is an
 * acceptable trade for a one-shot pipeline run.
 */
export declare function resolveEncoder(preference: EncoderPreference | undefined, defaultPreference: EncoderPreference): Promise<GpuEncoder>;
//# sourceMappingURL=gpu-encoder.d.ts.map