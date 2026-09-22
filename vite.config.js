import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      atomattr: resolve(__dirname, './src/index.js'),
      'atomattr/react': resolve(__dirname, './react/index.ts'),
    },
  },
});
