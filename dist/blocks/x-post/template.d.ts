import type { BlockDefinition } from '../types.js';
export interface XPostProps {
    handle: string;
    name: string;
    body: string;
    timestamp?: string;
    avatar?: string;
    verified?: boolean;
    [key: string]: unknown;
}
export declare const xPostBlock: BlockDefinition<XPostProps>;
//# sourceMappingURL=template.d.ts.map