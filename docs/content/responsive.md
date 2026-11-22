# Responsive attributes
> Apply mobile-first styles at registered viewport width thresholds.

## Breakpoint prefixes

Write a base attribute for the default style, then prefix an attribute with a breakpoint to apply it at that minimum viewport width. The thresholds are fixed at `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px and `2xl` 1536px.

<!-- atomattr:breakpoints -->

## Mobile-first example

This grid has one column by default, two columns from `sm` upward, and four columns from `lg` upward. Each prefixed attribute changes only the named CSS property.

```html
<div display="grid" grid-cols="1" sm-grid-cols="2" lg-grid-cols="4" gap="4">
  <article>One</article>
  <article>Two</article>
  <article>Three</article>
  <article>Four</article>
</div>
```

## Combining modifiers

Supported prefixes can be combined, such as `md-dark-hover-bg`. Atomattr composes media wrappers and selector states around the same attribute rule. Prefixes must appear in a supported combination and the final property name must be registered.

```html
<button bg="primary" md-px="6" dark-bg="gray-800" hover-bg="primary/80">
  Responsive button
</button>
```

For component-level responsiveness based on a container's width, see [Container queries](container-queries.html).
