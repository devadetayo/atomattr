import { cp, mkdir } from 'node:fs/promises';

await mkdir('site-dist/dist', { recursive: true });
await cp('dist/atomattr.min.js', 'site-dist/dist/atomattr.min.js');
await cp('dist/defaults.css', 'site-dist/dist/defaults.css');
