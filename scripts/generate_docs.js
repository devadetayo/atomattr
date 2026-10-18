import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsDir = path.join(__dirname, '..', 'docs');

function titleFromFilename(fn) {
  return fn.replace(/\.html?$/i, '').split('-').map(s => s[0]?.toUpperCase() + s.slice(1)).join(' ');
}

function generateContent(title, filename) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${title} — AtomAttr</title>
    <link rel="stylesheet" href="/src/style-data/defaults.css" />
    <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;margin:24px;line-height:1.5;color:#0f172a} pre{background:#0f172a;color:#e6eef8;padding:12px;border-radius:6px;overflow:auto}</style>
  </head>
  <body>
    <h1>${title}</h1>
    <p>This page documents how to use AtomAttr for <strong>${title}</strong>. Below are minimal, copy-paste examples for plain HTML, Vite (bundled apps), React, and Svelte. Use the appropriate section for your project and follow the common pitfalls listed.</p>

    <h2>1 — Minimal HTML example</h2>
    <p>Place the stylesheet and start the runtime once on the page.</p>
    <pre><code>&lt;link rel="stylesheet" href="/src/style-data/defaults.css" /&gt;
&lt;div bg="blue-600" p="6" rounded="md">${title} example (HTML)&lt;/div&gt;
&lt;script type="module"&gt;
  import { startAtomAttr } from '/src/index.js';
  startAtomAttr();
&lt;/script&gt;</code></pre>

    <h2>2 — Vite (bundler) example</h2>
    <p>Install and import the defaults stylesheet and runtime in your client entry.</p>
    <pre><code>npm install atomattr

// main.js
import 'atomattr/defaults.css';
import { startAtomAttr } from 'atomattr';
startAtomAttr();</code></pre>

    <h2>3 — React example</h2>
    <pre><code>// index.tsx
import 'atomattr/defaults.css';
import { startAtomAttr } from 'atomattr';
startAtomAttr();

// inside components
import { Box } from 'atomattr/react';
&lt;Box p="6" bg="white" rounded="lg"&gt;React ${title} example&lt;/Box&gt;</code></pre>

    <h2>4 — Svelte example</h2>
    <pre><code>// App.svelte
import 'atomattr/defaults.css';
import { onMount } from 'svelte';
onMount(async ()=>{
  const mod = await import('atomattr');
  mod.startAtomAttr();
});

&lt;main p="6" bg="brand"&gt;Svelte ${title} example&lt;/main&gt;</code></pre>

    <h2>Common pitfalls</h2>
    <ul>
      <li>Missing or incorrect path to <code>/src/style-data/defaults.css</code>.</li>
      <li>Calling <code>startAtomAttr()</code> multiple times — call it once at app start.</li>
      <li>For SSR apps, call the runtime only on the client (use onMount or client entry).</li>
      <li>Typo in attribute names — prefer copy-paste from examples.</li>
    </ul>

    <footer style="margin-top:32px;color:#334155">Edited automatically by scripts/generate_docs.js</footer>
  </body>
</html>`;
}

fs.readdir(docsDir, (err, files) => {
  if (err) {
    console.error('Failed reading docs dir', err);
    process.exit(1);
  }

  files.filter(f => f.endsWith('.html')).forEach(f => {
    const title = titleFromFilename(f);
    const out = generateContent(title, f);
    const outPath = path.join(docsDir, f);
    fs.writeFileSync(outPath, out, 'utf8');
    console.log('Wrote', outPath);
  });
});

console.log('Done');
