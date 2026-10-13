import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { NarrationTimeline } from './narration.js';
type TimelineFactory = (title: string) => NarrationTimeline;
export declare function createNarrationFixture(factory?: TimelineFactory): (_context: Record<string, unknown>, use: (timeline: NarrationTimeline) => Promise<void>, testInfo: {
    title: string;
}) => Promise<void>;
export declare function demoType(page: Page, selectorOrLocator: string | {
    pressSequentially: (text: string, options?: {
        delay?: number;
    }) => Promise<void>;
}, text: string, delay?: number): Promise<void>;
export declare const test: import("@playwright/test").TestType<import("@playwright/test").PlaywrightTestArgs & import("@playwright/test").PlaywrightTestOptions & {
    narration: NarrationTimeline;
}, import("@playwright/test").PlaywrightWorkerArgs & import("@playwright/test").PlaywrightWorkerOptions>;
export { expect };
//# sourceMappingURL=fixtures.d.ts.map