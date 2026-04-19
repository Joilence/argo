import type { BlockDefinition } from './types.js';

/**
 * Compile-time registry. Each block is a self-contained folder under
 * `src/blocks/<name>/`. To add a block, import it here and add it to
 * the registry below — `BlockName` auto-expands via `keyof typeof`.
 *
 * Using `as const satisfies` gives us a literal-union `BlockName` type
 * while still enforcing that every entry conforms to `BlockDefinition`.
 */
export const BLOCK_REGISTRY = {
  // Populated in subsequent tasks.
} as const satisfies Record<string, BlockDefinition>;

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
