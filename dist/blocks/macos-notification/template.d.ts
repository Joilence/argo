import type { BlockDefinition } from '../types.js';
export interface MacOSNotificationProps {
    appName: string;
    title: string;
    body: string;
    timestamp?: string;
    appIcon?: string;
    [key: string]: unknown;
}
export declare const macosNotificationBlock: BlockDefinition<MacOSNotificationProps>;
//# sourceMappingURL=template.d.ts.map