# Gap
> Set space between flex items, grid tracks, or multicolumn content.

## Set a uniform gap

Use `gap` on a flex or grid container to create consistent space between its items or tracks. Numeric spacing tokens use the spacing scale: `gap="4"` resolves to `16px`. The gap is internal to the layout and does not add space around the container's outer edge.

```html
<div display="grid" grid-cols="1" md-grid-cols="3" gap="4">
  <article>First</article><article>Second</article><article>Third</article>
</div>
```

## Set row and column gaps separately

Use `gap-x` for the column gap and `gap-y` for the row gap. These are useful for grids with different horizontal and vertical rhythm, or wrapped flex rows. CSS lengths such as `1rem` and supported functions can also be used.

```html
<div display="grid" grid-cols="2" gap-x="6" gap-y="3">
  <article>Column spacing differs from row spacing.</article><article>Second</article>
</div>
```

## Where gap applies

Gap is supported by grid and flex containers and by CSS multi-column layouts. It does not space arbitrary block children unless their parent uses a layout mode that supports gap. For margins between only some children, use margin properties instead.

## Attributes

The table lists the uniform, row, and column gap attributes and their CSS outputs.
