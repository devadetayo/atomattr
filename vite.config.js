import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { readdirSync } from 'node:fs';

const htmlPages = [
  ...readdirSync('.', { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.html'))
    .map(entry => entry.name),
  ...['docs', 'blog'].flatMap(directory =>
    readdirSync(directory, { withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.html'))
      .map(entry => `${directory}/${entry.name}`)
  ),
];

const htmlInputs = Object.fromEntries(
  htmlPages.map(file => [file.replace(/\.html$/, ''), resolve(__dirname, file)])
);

export default defineConfig({
  plugins: [react()],
  build: {
    // Keep the website output separate: dist/ is the publishable library.
    outDir: 'site-dist',
    rollupOptions: {
      // Publish every static route at its existing URL, including generated
      // documentation pages and the blog, not only the two homepages.
      input: htmlInputs,
    },
  },
  resolve: {
    alias: {
      atomattr: resolve(__dirname, './src/index.js'),
      'atomattr/react': resolve(__dirname, './react/index.ts'),
    },
  },
});
