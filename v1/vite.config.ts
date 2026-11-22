import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { copyFileSync, mkdirSync } from 'node:fs';

const studioDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    copyPublicDir: true,
    rollupOptions: {
      plugins: [{
        name: 'copy-local-atomattr-export-runtime',
        writeBundle() {
          const runtimeDir = resolve(studioDir, 'dist/atomattr-runtime');
          mkdirSync(runtimeDir, { recursive: true });
          copyFileSync(resolve(studioDir, '../dist/atomattr.min.js'), resolve(runtimeDir, 'atomattr.min.js'));
          copyFileSync(resolve(studioDir, '../src/style-data/defaults.css'), resolve(runtimeDir, 'defaults.css'));
        },
      }],
    },
  },
  resolve: {
    alias: {
      'atomattr/defaults.css': resolve(studioDir, '../src/style-data/defaults.css'),
      'atomattr/react': resolve(studioDir, '../react/index.ts'),
      atomattr: resolve(studioDir, '../src/index.js'),
    },
  },
});
