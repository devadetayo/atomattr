# Display
> Choose whether an element participates as a block, inline, flex, grid, or other display box.

## Choose a display mode

Use `display` for CSS display values such as `block`, `inline-flex`, `grid`, or `none`. Registered bare helpers such as `flex`, `grid`, `block`, and `hidden` are available for common modes. `hidden` maps to `display: none`; `invisible` maps to `visibility: hidden` and keeps the element's layout space.

```html
<nav display="flex" items="center" gap="4">
  <a href="/">Home</a>
  <a href="/about">About</a>
</nav>
```

## Flex and grid containers

Choose `flex` for a one-dimensional row or column of items and `grid` when rows and columns both matter. Display only establishes the layout mode; use [flex attributes](layout-flex.html), [grid attributes](layout-grid.html), and [alignment](layout-alignment.html) to configure it.

```html
<div display="grid" grid-cols="1" md-grid-cols="3" gap="4">
  <article>First</article><article>Second</article><article>Third</article>
</div>
```

## Responsive display

Display is a CSS property and can be changed at viewport breakpoints. This is useful for showing a compact mobile control and a full navigation on wider screens. Prefer a semantic native element and ensure hidden content is also handled correctly for interaction and accessibility.

```html
<button display="inline-flex" md-display="none" aria-label="Open menu">Menu</button>
<nav display="none" md-display="flex">...</nav>
```

## Attributes

The table lists the registered display-related attributes and helpers. Values follow CSS `display` unless a helper name itself selects the declaration.
