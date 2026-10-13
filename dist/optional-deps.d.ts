export type InstallMode = 'project' | 'global' | 'npx';
/** Packages to install for one optional capability, per install mode.
 *  `global` is a separate list because global trees do not hoist. */
export interface OptionalDepSpec {
    /** Human-readable capability name, used in the error message. */
    feature: string;
    /** Install list for a project-local Argo. */
    project: string[];
    /** Install list for a globally installed Argo. */
    global: string[];
}
export declare const KOKORO_DEP: OptionalDepSpec;
export declare const TRANSFORMERS_DEP: OptionalDepSpec;
export declare const WHISPER_DEP: OptionalDepSpec;
export declare const MUSICGEN_DEP: OptionalDepSpec;
export declare const OPENAI_DEP: OptionalDepSpec;
export declare const ELEVENLABS_DEP: OptionalDepSpec;
export declare const GEMINI_DEP: OptionalDepSpec;
export declare const SARVAM_DEP: OptionalDepSpec;
/** Where is this copy of Argo installed from? Cached per process.
 *
 *  npx unpacks into `~/.npm/_npx/<hash>/`, which is unambiguous. Otherwise
 *  ask the real resolver: does the user's project resolve `@argo-video/cli`
 *  to the very copy now running? If so, `npm i <engine>` lands somewhere
 *  this process can see it, which is what makes the hint correct.
 *
 *  Delegating to the resolver rather than parsing the path keeps pnpm's
 *  `.pnpm/<pkg>/node_modules/...` store, npm's nested fallback layout, and
 *  Yarn PnP working without special cases. Comparing identity rather than
 *  mere resolvability also catches running a global Argo from inside a
 *  project that happens to have its own copy. */
export declare function detectInstallMode(): InstallMode;
/** Reset the cached mode. Tests only. */
export declare function resetInstallModeCache(): void;
/** The exact command to install `spec` for the current install mode. */
export declare function installCommand(spec: OptionalDepSpec, mode?: InstallMode): string;
/** True when `err` is Node's "package is not installed" failure.
 *
 *  Distinguishes a missing optional dependency from a real fault inside a
 *  dependency that *is* installed. Those must keep propagating unchanged. */
export declare function isModuleNotFound(err: unknown): boolean;
/** Error explaining which optional package is missing and how to install it. */
export declare function missingDependencyError(spec: OptionalDepSpec, cause?: unknown): Error;
/** Dynamic-import wrapper that turns a missing optional package into an
 *  actionable error, and leaves every other failure untouched.
 *
 *  A module-not-found is not enough on its own to blame the optional
 *  package: the same code surfaces when the package is present but one of
 *  *its* dependencies fails to load. `onnxruntime-node` does exactly that,
 *  requiring a per-arch native binding at runtime, so a machine without a
 *  matching prebuilt binary would otherwise be told to install `kokoro-js`
 *  when it already has it. Confirm the package really is absent first. */
export declare function importOptional<T>(load: () => Promise<T>, spec: OptionalDepSpec): Promise<T>;
/** Is the optional package for `spec` resolvable right now? Used by
 *  `argo doctor` to report engine availability without loading anything.
 *
 *  Only a genuine module-not-found means "absent". A corrupt manifest or a
 *  broken `exports` map throws a different code and must not be reported as
 *  "not installed", or the user reinstalls a package that is already there.
 *
 *  Reading this as "not known to be absent" is what makes it total. A probe
 *  can fail on its own: an interrupted `npm i` leaves a truncated
 *  `package.json` (`ERR_INVALID_PACKAGE_CONFIG`) and an `exports` map with no
 *  matching condition throws `ERR_PACKAGE_PATH_NOT_EXPORTED`. Neither may
 *  escape. `importOptional` calls this from inside a `catch`, where a throw
 *  would replace the real import failure, and `argo doctor` is the command a
 *  user runs precisely because their install is half-broken. */
export declare function isDepInstalled(spec: OptionalDepSpec): boolean;
//# sourceMappingURL=optional-deps.d.ts.map