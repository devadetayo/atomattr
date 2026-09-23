import { copyFile, mkdir } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await copyFile('src/style-data/defaults.css', 'dist/defaults.css');
