import type { BlockDefinition } from '../types.js';
export interface InstagramFollowProps {
    handle: string;
    name: string;
    avatar?: string;
    isFollowing?: boolean;
    verified?: boolean;
    [key: string]: unknown;
}
export declare const instagramFollowBlock: BlockDefinition<InstagramFollowProps>;
//# sourceMappingURL=template.d.ts.map