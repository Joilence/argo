import type { BlockDefinition } from './types.js';
/**
 * Compile-time registry. Each block is a self-contained folder under
 * `src/blocks/<name>/`. To add a block, import it here and add it to
 * the registry below — `BlockName` auto-expands via `keyof typeof`.
 *
 * Using `as const satisfies` gives us a literal-union `BlockName` type
 * while still enforcing that every entry conforms to `BlockDefinition`.
 */
export declare const BLOCK_REGISTRY: {
    readonly 'x-post': BlockDefinition<import("./x-post/template.js").XPostProps>;
    readonly 'macos-notification': BlockDefinition<import("./macos-notification/template.js").MacOSNotificationProps>;
    readonly 'yt-lower-third': BlockDefinition<import("./yt-lower-third/template.js").YtLowerThirdProps>;
    readonly 'data-chart': BlockDefinition<import("./data-chart/template.js").DataChartProps>;
    readonly 'spotify-card': BlockDefinition<import("./spotify-card/template.js").SpotifyCardProps>;
    readonly 'instagram-follow': BlockDefinition<import("./instagram-follow/template.js").InstagramFollowProps>;
    readonly 'tiktok-follow': BlockDefinition<import("./tiktok-follow/template.js").TikTokFollowProps>;
    readonly 'reddit-post': BlockDefinition<import("./reddit-post/template.js").RedditPostProps>;
    readonly 'logo-outro': BlockDefinition<import("./logo-outro/template.js").LogoOutroProps>;
    readonly flowchart: BlockDefinition<import("./flowchart/template.js").FlowchartProps>;
    readonly 'app-showcase': BlockDefinition<import("./app-showcase/template.js").AppShowcaseProps>;
    readonly 'ui-3d-reveal': BlockDefinition<import("./ui-3d-reveal/template.js").Ui3dRevealProps>;
};
export type BlockName = keyof typeof BLOCK_REGISTRY;
export declare function isValidBlockName(name: string): name is BlockName;
export declare function getBlock<N extends BlockName>(name: N): (typeof BLOCK_REGISTRY)[N];
export type { BlockDefinition } from './types.js';
//# sourceMappingURL=index.d.ts.map