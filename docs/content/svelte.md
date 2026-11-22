# Svelte
> Use Atomattr in Svelte and SvelteKit with plain attributes on native elements. No component package is needed.

## Setup

Install `atomattr`, import `atomattr/defaults.css` once, and start the engine in the browser. In a Vite project that is the entry file; in SvelteKit it is the root layout.

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import 'atomattr/defaults.css';
  import { onMount } from 'svelte';
  onMount(async () => (await import('atomattr')).startAtomAttr());
</script>

<slot />
```

Starting inside `onMount` keeps the engine out of server rendering, where there is no DOM to observe.

## Write attributes in markup

Svelte keeps unknown attributes on native elements, so the canonical HTML attributes work as written, including modifier prefixes such as `md-`, `hover-` and `dark-`.

```svelte
<section display="flex" flex-col md-flex-row gap="4" p="6" rounded="2xl" bg="surface" border="border">
  <h2 font-size="xl" font-weight="bold">Atomattr in Svelte</h2>
  <button px="4" py="2" rounded="lg" bg="primary" text="white" hover-bg="primary/80">Continue</button>
</section>
```

## Dynamic values and state

Bind a value with Svelte's normal curly braces. The engine watches attribute changes, so the generated rule follows the new value.

```svelte
<script>
  let tone = $state('primary');
</script>

<button px="4" py="2" rounded="lg" bg={tone} text="white" onclick={() => (tone = tone === 'primary' ? 'emerald-600' : 'primary')}>
  Toggle colour
</button>
```

Use plain values from the token scale or a complete CSS value. Build the whole value in script (`bg={isActive ? 'primary' : 'gray-200'}`) instead of concatenating fragments, so each value is something the engine recognises.

## Components and props

Pass attribute values through props and spread them where they apply. A small wrapper keeps repeated styling in one place without introducing classes.

```svelte
<!-- Card.svelte -->
<script>
  let { title, children } = $props();
</script>

<article p="6" rounded="2xl" bg="surface" border="border" shadow="md">
  <h3 font-size="lg" font-weight="bold" mb="2">{title}</h3>
  {@render children?.()}
</article>
```

## Common issues

If a style does not appear, check that the stylesheet is imported, that the engine started in the browser, and that Svelte did not strip the attribute: the compiler only keeps attributes written on native elements, not on component tags. For a component, forward the value to a native element inside it.
