import type { BlockDefinition } from '../types.js';
export interface RedditPostProps {
    subreddit: string;
    author: string;
    timestamp?: string;
    title: string;
    body?: string;
    upvotes?: number;
    comments?: number;
    [key: string]: unknown;
}
export declare const redditPostBlock: BlockDefinition<RedditPostProps>;
//# sourceMappingURL=template.d.ts.map