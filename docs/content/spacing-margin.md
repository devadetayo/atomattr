# Margin
> Add space outside an element or use automatic margins for alignment.

## Sides and spacing tokens

Use `m` for all sides, or `mt`, `mr`, `mb`, and `ml` for individual physical sides. `mx` sets left and right margins; `my` sets top and bottom margins. Numeric values use the spacing scale, so `m="4"` is `16px`. Negative CSS lengths can be passed through when an element needs to overlap its neighbors.

```html
<main max-w="4xl" mx="auto" p="4">
  <h1 mb="4">Centered content</h1>
  <p>Automatic horizontal margins center a block with a constrained width.</p>
</main>
```

## Logical margins

Use `ms` and `me` for inline start and end margins. Longer `margin-inline*` and `margin-block*` attributes map to CSS logical properties and follow the element's writing direction.

## Automatic margins

Use `mx="auto"` or the bare `mx-auto` helper to center a block when it has a constrained width. Automatic margins can also distribute free space in flex layouts. The element still needs a layout and sizing context where margins can take effect.

## Margin and gap

For consistent spacing between every flex or grid child, `gap` often expresses the layout more directly. Margins are useful when spacing belongs to one item, when collapsing behavior is intentional, or when positioning content outside a grid/flex layout.

## Attributes

The table lists supported physical and logical margin attributes and their CSS outputs.
