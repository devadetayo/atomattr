# Inset and z-index
> Offset positioned elements and control their stacking order.

## Physical and logical insets

Use `top`, `right`, `bottom`, and `left` for physical offsets. Use `inset`, `inset-x`, and `inset-y` for shorthand offsets; logical forms such as `inset-inline-start` adapt to writing direction. Numeric offsets use the spacing scale, while values such as `0`, `50%`, `1rem`, or `calc(...)` follow CSS length rules.

```html
<div position="relative" h="40">
  <button position="absolute" inset-block-start="0" inset-inline-end="0">Close</button>
</div>
```

## Centering with offsets

An absolutely positioned element can use opposing insets to stretch across an axis. To center an element precisely, combine `top="50%"`, `left="50%"`, and `translate-x="-50%"` / `translate-y="-50%"`; for ordinary layout alignment, flexbox or grid is usually easier to maintain.

## Stacking order

`z` maps to `z-index`. It matters when elements overlap, but it only compares within the relevant stacking context. Properties such as transforms, opacity, and positioned elements with a z-index can create stacking contexts that prevent a child from stacking above unrelated content.

## Attributes

The table lists physical and logical inset attributes and the z-index attribute. Pair offsets with an appropriate `position` value.
