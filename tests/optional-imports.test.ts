import { describe, it, expect } from 'vitest';
import { readFileSync, globSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

/** Packages declared as optional peers in package.json. None may be reachable
 *  through a static import, or the whole install-footprint design collapses:
 *  a top-level import fails at module-link time and takes down every command,
 *  including ones that never touch TTS. */
const OPTIONAL_PACKAGES = [
  'kokoro-js',
  '@huggingface/transformers',
  'openai',
  '@elevenlabs/elevenlabs-js',
  '@google/genai',
  'sarvamai',
];

/** `import x from 'pkg'` / `export * from 'pkg'` but NOT `import('pkg')`.
 *  The negative lookbehind on `(` is what separates static from dynamic. */
function staticImportOf(pkg: string): RegExp {
  const escaped = pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<!\\()\\bfrom\\s+['"]${escaped}['"]`);
}

describe('optional packages are never statically imported', () => {
  // All six are devDependencies, so they resolve during tests. Nothing else in
  // the suite can notice a regression from `await import(x)` back to a
  // top-level `import x from`. This test is the only guard.
  const files = globSync('**/*.ts', { cwd: SRC })
    .map((f) => join(SRC, f))
    .filter((f) => !f.endsWith('.d.ts'));

  it('finds source files to scan', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  for (const pkg of OPTIONAL_PACKAGES) {
    it(`no static import of ${pkg}`, () => {
      const pattern = staticImportOf(pkg);
      const offenders = files
        .filter((file) => {
          const src = readFileSync(file, 'utf-8');
          return src.split('\n').some((line) => {
            const code = line.replace(/\/\/.*$/, '').replace(/^\s*\*.*$/, '');
            return pattern.test(code);
          });
        })
        .map((f) => relative(SRC, f));
      expect(offenders).toEqual([]);
    });
  }
});
