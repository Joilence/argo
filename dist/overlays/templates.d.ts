import type { OverlayCue } from './types.js';
import type { BackgroundTheme } from './zones.js';
export interface TemplateResult {
    contentHtml: string;
    styles: Record<string, string>;
}
/**
 * Whether a cue renders as a zone template. `hf-component` cues are injected
 * full-frame at record time and `hf-block` cues are composited at export time,
 * so `renderTemplate` refuses both. Every caller that walks a manifest's
 * overlays — the preview, the imported-video PNG pre-pass — must filter with
 * this first, or one hyperframes cue takes down the whole path.
 */
export declare function isZoneTemplateCue(cue: Pick<OverlayCue, 'type'>): boolean;
export declare function renderTemplate(cue: OverlayCue, theme?: BackgroundTheme): TemplateResult;
//# sourceMappingURL=templates.d.ts.map