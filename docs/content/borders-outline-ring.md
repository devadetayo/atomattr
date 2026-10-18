# Outline and ring
> Provide visible focus indicators with outlines or AtomAttr's simple ring helper.

## CSS outlines

Use `outline` with an outline shorthand or width, and set `outline-style`, `outline-color`, and `outline-offset` independently as needed. Outlines do not take up layout space. The `outline-none` helper removes an outline; use it only when you provide another clear focus indicator.

```html
<button focus-visible-outline="2px solid" focus-visible-outline-color="primary" focus-visible-outline-offset="2px">
  Keyboard focus me
</button>
```

## Ring helper

`ring` generates a simple outer `box-shadow` whose width comes from its value and whose color is a fixed translucent dark color. `ring-color` is a separate dictionary mapping to the CSS property, but does not currently alter the color emitted by the `ring` helper. Use regular `box-shadow` or outline declarations when you need complete control over color and offset.

## Keep keyboard focus visible

Do not remove browser focus outlines without an equivalent visual indicator. Ensure the indicator contrasts against adjacent surfaces and remains visible in all themes and forced-color settings.

## Attributes

The table lists outline and ring-related attributes. `focus-visible-` applies the declaration only while the element matches `:focus-visible`.
