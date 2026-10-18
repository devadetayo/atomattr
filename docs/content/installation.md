# Installation
> Choose the setup that matches your project. The browser engine reads Atomattr attributes and generates their CSS at runtime.

## Install in a JavaScript project

Install the package from your project directory. This is the setup for Vite, React, Svelte, and other JavaScript build tools.

```bash
npm install atomattr
```

The package provides the browser engine and `defaults.css`. Vite is a build tool, not a framework: use the framework-specific section below if your app uses React or Svelte.

## Plain HTML with a local package build

If you are working in this repository or have built Atomattr from source, run `npm run build:library` first. The generated files live under `/dist` in the project root. Reference them from a page served by the same project:

```html
<link rel="stylesheet" href="/dist/defaults.css">
<script src="/dist/atomattr.min.js" defer></script>
```

For a standalone static HTML file with no local build, use the published browser bundle and stylesheet from a CDN. Replace `1.0.1` with the version you intend to pin:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/atomattr@1.0.1/dist/defaults.css">
<script src="https://cdn.jsdelivr.net/npm/atomattr@1.0.1/dist/atomattr.min.js" defer></script>
```

Keep the stylesheet and script on the same Atomattr version. The deferred script starts the engine after the HTML has been parsed.

## Vite with plain HTML

Import the stylesheet and engine from the JavaScript entry point, such as `src/main.js`:

```js
// src/main.js
import 'atomattr/defaults.css';
import { startAtomAttr } from 'atomattr';

startAtomAttr();
```

The engine also starts automatically when imported in a browser. Calling `startAtomAttr()` explicitly is useful when you want to show where startup happens; it is safe to call more than once. For inserted markup, call `refreshAtomAttr(container)` if you need the new rules immediately; the engine also observes DOM changes.

## React with Vite

Import the engine and stylesheet once in the app entry (`src/main.jsx` or `src/main.tsx`). Importing `atomattr/react` also ensures the engine is started, so this explicit call is optional when using the React primitives.

```tsx
// src/main.tsx
import 'atomattr/defaults.css';
import { startAtomAttr } from 'atomattr';
import { Box, Txt } from 'atomattr/react';

startAtomAttr();

export function App() {
  return (
    <Box bg="surface" p="6" rounded="xl">
      <Txt text="foreground">Atomattr in React</Txt>
    </Box>
  );
}
```

In React, use JSX-friendly camel-case props for dashed names, for example `fontSize` for the HTML attribute `font-size`. See the [React guide](react.html) for aliases and complete examples.

## Svelte with Vite

Import the global stylesheet and start the engine once from your Svelte entry point (`src/main.js` or `src/main.ts`):

```js
// src/main.js
import 'atomattr/defaults.css';
import { startAtomAttr } from 'atomattr';
import { mount } from 'svelte';
import App from './App.svelte';

startAtomAttr();
mount(App, { target: document.getElementById('app') });
```

Use canonical dashed HTML attributes in Svelte markup. For example:

```svelte
<section bg="surface" p="6" rounded="xl">
  <h1 font-size="2xl" font-weight="bold">Atomattr in Svelte</h1>
</section>
```

This setup assumes a Svelte version/compiler that preserves unknown attributes on native HTML elements. Atomattr does not provide a Svelte component package.

## Verify the setup

Put a visible style on a native element, such as `<div p="4" bg="primary" text="white">Ready</div>`. Check that the content has padding and a colored background. If it does not, confirm the stylesheet loaded, the browser engine was imported or its script was loaded, and the attributes use supported Atomattr names. The [HTML guide](html.html), [React guide](react.html), and [syntax reference](syntax.html) explain the markup in more detail.
