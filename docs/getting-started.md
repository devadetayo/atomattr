# Getting Started

This guide explains how to install and initialize AtomAttr in plain HTML, Vite, React, and Svelte projects. Each section includes minimal copy-paste examples and common pitfalls so you won't make mistakes.

## Quick overview

AtomAttr is an "HTML-first" attribute-driven styling engine. You author classes via attributes like `bg="blue-600"` or `p="6"` and the runtime generates and injects the matching CSS rules. Initialize the runtime once per page/app.

## Install

- CDN (fast start): include the defaults stylesheet and a small runtime module from your served files or CDN.
- NPM (recommended for apps): `npm install atomattr` and import the runtime and defaults stylesheet in your app entry.

### Files you need to point to

- `defaults.css` — the base design tokens/styles. Must load before your app styles that rely on variables.
- runtime module (exports `startAtomAttr`) — call once on app startup.

## 1) HTML (plain, without bundler)

Copy these into your HTML file. Ensure paths to `defaults.css` and `index.js` are correct relative to your server root.

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link rel="stylesheet" href="/src/style-data/defaults.css" />
    <title>AtomAttr — HTML Example</title>
  </head>
  <body>
    <div bg="blue-600" p="6" rounded="md">Hello AtomAttr (HTML)</div>

    <script type="module">
      import { startAtomAttr } from '/src/index.js';
      // Start once when the page loads
      startAtomAttr();
    </script>
  </body>
</html>
```

Common mistakes (HTML):
- Wrong path to `defaults.css` — verify the file is served and the link returns 200.
- Calling `startAtomAttr` multiple times — only call once per page.

## 2) Vite (or other bundler) — quick setup

Install via NPM and import the stylesheet and starter in your entry (e.g. `main.js`/`main.ts`):

```bash
npm install atomattr
```

```js
// main.js (Vite)
import 'atomattr/defaults.css';
import { startAtomAttr } from 'atomattr';

startAtomAttr();

// ...your app bootstrap (React/Svelte/Vue) goes here
```

Notes for Vite:
- If you use SSR, only call `startAtomAttr()` on the client (e.g. inside a client entry or after hydration).
- Ensure `defaults.css` is included in the client bundle or loaded as a static asset.

## 3) React

Install the package and import the CSS at your application root. Start the runtime once (for example in `index.tsx` before `createRoot`).

```bash
npm install atomattr
```

```tsx
// index.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import 'atomattr/defaults.css';
import { startAtomAttr } from 'atomattr';
import App from './App';

startAtomAttr();

createRoot(document.getElementById('root')!).render(<App />);
```

JSX examples

```tsx
import { Box, H2, Txt } from 'atomattr/react';

export default function Card() {
  return (
    <Box bg="white" p="6" rounded="2xl" shadow="lg">
      <H2 fontSize="2xl" weight="black">Card title</H2>
      <Txt mt="2" text="slate-600">Same contract, React wrapper.</Txt>
    </Box>
  );
}
```

React tips:
- Use `attrs` if you need the exact canonical attribute name with dashes: `<Box attrs={{ 'font-size': '4xl' }} />`.
- Prefer starting the runtime once at app entry, not inside components.

## 4) Svelte

Svelte apps can use the same runtime. Initialize on mount so it runs only in the browser.

```bash
npm install atomattr
```

```svelte
<!-- App.svelte -->
<script>
  import 'atomattr/defaults.css';
  import { onMount } from 'svelte';
  let start;
  onMount(async () => {
    const mod = await import('atomattr');
    mod.startAtomAttr();
  });
</script>

<main bg="brand" p="6">Hello from Svelte + AtomAttr</main>
```

Svelte tips:
- Import `defaults.css` at the top-level so styles are available before components mount.
- Use `onMount` to call `startAtomAttr()` to avoid running the runtime during SSR.

## Modifiers and tokens (short)

- Modifiers are prefixes: `hover-`, `md-`, `group-hover-`, `dark-`, etc.
- Tokens: spacing `0, 0.5, 1, 2, 4, 6`, sizes `full`, `screen`, radius `sm, md, lg`, colors like `slate-900`.

Example:

```html
<button bg="brand" hover-bg="slate-950" md-px="6">Click</button>
```

## Troubleshooting

- Styles don't appear: confirm `defaults.css` is loaded and `startAtomAttr()` was run.
- Attributes ignored: check for typos and ensure the runtime scanned the DOM (call `startAtomAttr()` after dynamic DOM updates or use its mutation observer option).
- Multiple init calls: remove duplicate `startAtomAttr()` calls; call once at app start.

## Next steps

- Use the examples above to verify your environment (HTML, Vite, React, or Svelte).
- After confirming the base setup, check component pages in `/docs/` for example-specific updates.

If you want, I can now update the next docs HTML file with similar clarity and examples.
