import { build } from 'esbuild';
import { copyFileSync, mkdirSync } from 'node:fs';

// Each script is bundled standalone as IIFE (MV3 content scripts can't be ESM),
// inlining the shared @pie/integrity-core protocol so there are no shared chunks.
mkdirSync('dist', { recursive: true });

await build({
  entryPoints: ['src/content.ts'],
  bundle: true,
  format: 'iife',
  target: 'chrome110',
  outfile: 'dist/content.js',
});
await build({
  entryPoints: ['src/background.ts'],
  bundle: true,
  format: 'iife',
  target: 'chrome110',
  outfile: 'dist/background.js',
});

copyFileSync('manifest.json', 'dist/manifest.json');
console.log('PIE extension built → dist/');
