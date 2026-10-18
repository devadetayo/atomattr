# Grid
> Define rows and columns for two-dimensional layouts.

## Define columns and rows

Set `display="grid"` to create a grid container. `grid-cols="3"` resolves to three equal flexible columns; `grid-rows` works similarly for rows. CSS track lists, `auto`, and supported values such as `subgrid` can be passed directly.

```html
<div display="grid" grid-cols="1" sm-grid-cols="2" lg-grid-cols="4" gap="4">
  <article>One</article><article>Two</article><article>Three</article><article>Four</article>
</div>
```

## Place and span items

Use `col-span` and `row-span` for numeric spans, or the `col-start`, `col-end`, `row-start`, and `row-end` attributes to set line placement. These accept CSS grid placement values. `grid-template-areas` accepts a CSS area definition; name the corresponding areas on children using the registered `grid-area` attribute.

## Automatic tracks

Use `auto-flow`, `auto-cols`, and `auto-rows` to control automatically placed items and implicit tracks. The value is passed to CSS, so consult CSS Grid syntax for functions such as `minmax()` and `fit-content()`.

```html
<div display="grid" grid-cols="repeat(2, minmax(0, 1fr))" auto-flow="row" auto-rows="minmax(8rem, auto)" gap="4">
  <article>Content-sized row</article><article>Another item</article>
</div>
```

## Attributes

The table lists registered grid and placement attributes. See [alignment](layout-alignment.html) for item alignment and [gap](layout-gap.html) for track spacing.
