import type { BlockDefinition } from './types.js';
import { xPostBlock } from './x-post/template.js';
import { macosNotificationBlock } from './macos-notification/template.js';
import { ytLowerThirdBlock } from './yt-lower-third/template.js';
import { dataChartBlock } from './data-chart/template.js';

/**
 * Compile-time registry. Each block is a self-contained folder under
 * `src/blocks/<name>/`. To add a block, import it here and add it to
 * the registry below — `BlockName` auto-expands via `keyof typeof`.
 *
 * Using `as const satisfies` gives us a literal-union `BlockName` type
 * while still enforcing that every entry conforms to `BlockDefinition`.
 */
export const BLOCK_REGISTRY = {
  'x-post': xPostBlock,
  'macos-notification': macosNotificationBlock,
  'yt-lower-third': ytLowerThirdBlock,
  'data-chart': dataChartBlock,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as const satisfies Record<string, BlockDefinition<any>>;

Object.freeze(BLOCK_REGISTRY);

export type BlockName = keyof typeof BLOCK_REGISTRY;

export function isValidBlockName(name: string): name is BlockName {
  return Object.prototype.hasOwnProperty.call(BLOCK_REGISTRY, name);
}

export function getBlock<N extends BlockName>(name: N): (typeof BLOCK_REGISTRY)[N] {
  if (!isValidBlockName(name)) {
    throw new Error(`Unknown block: "${name}". Known blocks: ${Object.keys(BLOCK_REGISTRY).join(', ')}`);
  }
  return BLOCK_REGISTRY[name];
}

export type { BlockDefinition } from './types.js';
