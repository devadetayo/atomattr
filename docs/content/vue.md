# Vue
> Use Atomattr in Vue 3 and Nuxt with plain attributes in templates. No plugin or component package is required.

## Setup

Install `atomattr`, import the stylesheet once, and start the engine in the browser.

```js
// src/main.js
import { createApp } from 'vue';
import 'atomattr/defaults.css';
import { startAtomAttr } from 'atomattr';
import App from './App.vue';

startAtomAttr();
createApp(App).mount('#app');
```

In Nuxt, list `atomattr/defaults.css` in the `css` option of `nuxt.config.ts` and start the engine from a client-only plugin named `plugins/atomattr.client.ts`, so it never runs during server rendering.

## Write attributes in templates

Vue renders attributes it does not recognise as plain DOM attributes, so canonical Atomattr attributes work unchanged on native elements.

```vue
<template>
  <section display="flex" flex-col md-flex-row gap="4" p="6" rounded="2xl" bg="surface" border="border">
    <h2 font-size="xl" font-weight="bold">Atomattr in Vue</h2>
    <button px="4" py="2" rounded="lg" bg="primary" text="white" hover-bg="primary/80">Continue</button>
  </section>
</template>
```

## Dynamic values

Bind with `:` as usual. The engine watches attribute changes and generates a rule for the new value.

```vue
<script setup>
import { ref } from 'vue';
const tone = ref('primary');
</script>

<template>
  <button px="4" py="2" rounded="lg" :bg="tone" text="white" @click="tone = tone === 'primary' ? 'emerald-600' : 'primary'">
    Toggle colour
  </button>
</template>
```

Compute the whole value (`:bg="active ? 'primary' : 'gray-200'"`) rather than joining fragments, so every value is one the engine recognises.

## Components

Attributes placed on a component fall through to its root element by default (Vue's attribute inheritance), which lets a parent add layout attributes to a child.

```vue
<!-- Card.vue -->
<template>
  <article p="6" rounded="2xl" bg="surface" border="border" shadow="md">
    <slot />
  </article>
</template>
```

Using `<Card mt="6" md-mt="10">…</Card>` adds `mt` and `md-mt` to the `<article>`, merged with the attributes it already has.
