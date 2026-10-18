# Tailwind comparison
> A bridge for readers who already know Tailwind and want to understand the equivalent Atomattr shape.

## Mental model

Tailwind puts many utility decisions inside one `class` string. Atomattr keeps each decision as its own attribute, so scanning an element feels closer to reading named props.

```html
<!-- Tailwind-style utility classes -->
<article class="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
  <h3 class="mb-2 text-xl font-bold">Card title</h3>
  <p class="text-gray-500">Supporting text</p>
</article>

<!-- Atomattr attributes -->
<article rounded="2xl" border="1px" border-color="gray-200" bg="white" p="6" shadow="md">
  <h3 mb="2" font-size="xl" font-weight="bold">Card title</h3>
  <p text="gray-500">Supporting text</p>
</article>
```

## Responsive comparison

Breakpoint prefixes are similar in purpose, but Atomattr puts the breakpoint on the exact property attribute.

```html
<!-- Tailwind -->
<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"></div>

<!-- Atomattr -->
<div display="grid" grid-cols="1" gap="4" md-grid-cols="2" lg-grid-cols="4"></div>
```

## State comparison

State prefixes follow the same readable pattern: put the state before the property name.

```html
<!-- Tailwind -->
<button class="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"></button>

<!-- Atomattr -->
<button bg="primary" text="white" hover-bg="primary/80" disabled-opacity="50"></button>
```


```html
<article class="rounded-xl border p-5">
  <h3 class="text-lg font-bold">Tailwind source</h3>
</article>

<article rounded="xl" border="1px" p="5">
  <h3 font-size="lg" font-weight="bold">Atomattr version</h3>
</article>
```
