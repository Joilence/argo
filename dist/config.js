import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
// ---- Defaults ----
const DEFAULTS = {
    demosDir: 'demos',
    outputDir: 'videos',
    blocksDir: 'blocks',
    tts: { defaultVoice: 'af_heart', defaultSpeed: 1.0 },
    video: { width: 1920, height: 1080, fps: 30, browser: 'chromium', deviceScaleFactor: 1 },
    export: { preset: 'slow', crf: 16 },
    overlays: { autoBackground: false },
};
// ---- Functions ----
export function normalizeDeviceScaleFactor(rawScale) {
    const scale = typeof rawScale === 'number' && Number.isFinite(rawScale) ? rawScale : 1;
    return Math.max(1, Math.round(scale));
}
export function defineConfig(userConfig) {
    const video = {
        ...DEFAULTS.video,
        ...userConfig.video,
    };
    video.deviceScaleFactor = normalizeDeviceScaleFactor(video.deviceScaleFactor);
    return {
        ...DEFAULTS,
        ...userConfig,
        tts: { ...DEFAULTS.tts, ...userConfig.tts },
        video,
        export: { ...DEFAULTS.export, ...userConfig.export },
        overlays: { ...DEFAULTS.overlays, ...userConfig.overlays },
    };
}
export function resolveExportSize(config) {
    return {
        width: config.export.outputWidth ?? config.video.width,
        height: config.export.outputHeight ?? config.video.height,
    };
}
export function demosProject(options) {
    const scale = normalizeDeviceScaleFactor(options.deviceScaleFactor);
    const width = options.video?.width ?? 1920;
    const height = options.video?.height ?? 1080;
    return {
        name: 'demos',
        testDir: options.demosDir ?? 'demos',
        testMatch: '**/*.demo.ts',
        use: {
            browserName: options.browser ?? 'chromium',
            baseURL: options.baseURL,
            viewport: { width, height },
            deviceScaleFactor: scale,
            video: {
                mode: 'on',
                size: { width: width * scale, height: height * scale },
            },
        },
    };
}
const CONFIG_FILENAMES = [
    'argo.config.ts',
    'argo.config.js',
    'argo.config.mjs',
];
const DEMO_CONFIG_EXTENSIONS = ['.config.ts', '.config.js', '.config.mjs'];
async function fileExists(filePath) {
    try {
        await access(filePath);
        return true;
    }
    catch (err) {
        if (err?.code === 'ENOENT')
            return false;
        throw new Error(`Cannot access ${filePath}: ${err.message}`);
    }
}
/**
 * Locate a demo-scoped config file if one exists.
 * Searches `<demosDir>/<demoName>.config.{ts,js,mjs}` in order.
 * Returns the absolute path, or undefined if none found.
 *
 * `demosDir` defaults to `demos/` under cwd; callers that've resolved a
 * different demos directory should pass it explicitly.
 */
export async function resolveDemoConfigPath(cwd, demoName, demosDir = 'demos') {
    for (const ext of DEMO_CONFIG_EXTENSIONS) {
        const candidate = join(cwd, demosDir, `${demoName}${ext}`);
        if (await fileExists(candidate))
            return candidate;
    }
    return undefined;
}
export async function loadConfig(cwd, explicitPath) {
    let configPath = explicitPath;
    if (!configPath) {
        for (const filename of CONFIG_FILENAMES) {
            const candidate = join(cwd, filename);
            if (await fileExists(candidate)) {
                configPath = candidate;
                break;
            }
        }
    }
    if (!configPath) {
        return defineConfig({});
    }
    let mod;
    try {
        const fileUrl = pathToFileURL(configPath).href;
        mod = await import(fileUrl);
    }
    catch (err) {
        throw new Error(`Failed to load config from ${configPath}: ${err.message}`);
    }
    const userConfig = mod.default !== undefined ? mod.default : mod;
    if (typeof userConfig !== 'object' || userConfig === null || Array.isArray(userConfig)) {
        throw new Error(`Config file ${configPath} must export a plain object. ` +
            `Got ${Array.isArray(userConfig) ? 'array' : typeof userConfig}. ` +
            `Use: export default { baseURL: "...", ... }`);
    }
    return defineConfig(userConfig);
}
//# sourceMappingURL=config.js.map