# Installation
> Pick the setup that matches your project. The browser engine reads Atomattr attributes and generates their CSS at runtime, so every web framework uses the same two pieces: the stylesheet and one call to start the engine.

## What you install

Atomattr ships as one package, `atomattr`. It contains the browser engine, `defaults.css` (design tokens and resets), the React primitives, and the React Native entry. There is no per-framework plugin: Svelte, Vue, Angular and plain HTML all write the same canonical attributes on native elements.

```bash
npm install atomattr
```

The same works with `pnpm add atomattr`, `yarn add atomattr` or `bun add atomattr`. React and React Native projects already have their peer dependencies; the other frameworks need nothing extra.

## Plain HTML with a CDN

For a standalone static page, link the stylesheet and the deferred script. Replace `1.0.1` with the version you want to pin, and keep both files on the same version. The script starts the engine after the HTML has been parsed.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/atomattr@1.0.1/dist/defaults.css">
<script src="https://cdn.jsdelivr.net/npm/atomattr@1.0.1/dist/atomattr.min.js" defer></script>
```

If you built Atomattr locally with `npm run build:library`, use `/dist/defaults.css` and `/dist/atomattr.min.js` from the same project instead.

## Vite and other bundlers

Import the stylesheet and start the engine once from your entry file (`src/main.js` or `src/main.ts`). Every framework below builds on this step.

```js
// src/main.js
import 'atomattr/defaults.css';
import { startAtomAttr } from 'atomattr';

startAtomAttr();
```

The engine also starts when it is imported in a browser, so the explicit call mostly documents where startup happens. It is safe to call more than once. For markup you insert yourself, call `refreshAtomAttr(container)` when you need the new rules immediately; the engine otherwise observes DOM changes on its own.

## React

Import the stylesheet once in the app entry. Importing `atomattr/react` starts the engine, so the explicit call is optional. Use either the primitives with camel-case props, or plain elements with canonical attributes.

```tsx
// src/main.tsx
import 'atomattr/defaults.css';
import { Box, Txt } from 'atomattr/react';

export function App() {
  return (
    <Box bg="surface" p="6" rounded="xl">
      <Txt text="foreground" fontSize="lg">Atomattr in React</Txt>
    </Box>
  );
}
```

For Next.js, import `atomattr/defaults.css` in the root layout and start the engine from a client component. The engine runs in the browser, so server-rendered HTML shows unstyled until it starts; keep above-the-fold critical layout in the first client render.

```tsx
// app/atomattr-start.tsx
'use client';
import { useEffect } from 'react';
import { startAtomAttr } from 'atomattr';

export function AtomattrStart() {
  useEffect(() => { startAtomAttr(); }, []);
  return null;
}
```

## Svelte and SvelteKit

Start the engine from your entry point, or from `src/routes/+layout.svelte` in SvelteKit. Use canonical dashed attributes directly on elements; Svelte passes unknown attributes through.

```js
// src/main.js (Svelte + Vite)
import 'atomattr/defaults.css';
import { startAtomAttr } from 'atomattr';
import { mount } from 'svelte';
import App from './App.svelte';

startAtomAttr();
mount(App, { target: document.getElementById('app') });
```

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import 'atomattr/defaults.css';
  import { onMount } from 'svelte';
  onMount(async () => (await import('atomattr')).startAtomAttr());
</script>

<slot />
```

## Vue and Nuxt

Import the stylesheet and start the engine in `src/main.js`. In Nuxt, add the stylesheet to the `css` option and start the engine in a client-only plugin (`plugins/atomattr.client.ts`).

```js
// src/main.js (Vue + Vite)
import { createApp } from 'vue';
import 'atomattr/defaults.css';
import { startAtomAttr } from 'atomattr';
import App from './App.vue';

startAtomAttr();
createApp(App).mount('#app');
```

Vue treats attributes it does not recognise as plain attributes, so `p="6"`, `md-flex-row` and `hover-bg="primary/80"` work in templates unchanged. Use a normal `:attr="value"` binding when the value is dynamic.

## Angular

Add the stylesheet to the `styles` array in `angular.json` (`"node_modules/atomattr/dist/defaults.css"`) and start the engine in `main.ts`. Static attributes in templates pass through to the DOM.

```ts
// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { startAtomAttr } from 'atomattr';
import { AppComponent } from './app/app.component';

startAtomAttr();
bootstrapApplication(AppComponent);
```

Use `[attr.hover-bg]="color"` to bind a dynamic value, because Angular only binds DOM properties with plain `[name]`. In Angular 17+ templates, write a literal `@` as `&#64;`.

## React Native

React Native does not use the browser engine or `defaults.css`. Import the primitives from `atomattr/react-native` and style them with the same token names. See the [React Native guide](react-native.html) for what is supported on each platform.

```tsx
import { Box, Txt } from 'atomattr/react-native';

export const Hello = () => <Box p="4" bg="primary"><Txt>Ready</Txt></Box>;
```

## Verify the setup

Put a visible style on a native element, such as `<div p="4" bg="primary" text="white">Ready</div>`. The content should have padding and a coloured background. If it does not, confirm that the stylesheet loaded, that the engine was imported or its script was loaded, and that the attribute names are supported. The [HTML](html.html), [React](react.html), [Svelte](svelte.html), [Vue](vue.html) and [Angular](angular.html) guides go deeper, and the [syntax reference](syntax.html) explains the attribute grammar.
