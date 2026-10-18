# Padding
> Add inner space between an element's border and its content.

## All sides and individual sides

Use `p` for all four sides, or `pt`, `pr`, `pb`, and `pl` for physical sides. `px` sets left and right padding; `py` sets top and bottom padding. Numeric values use the spacing scale, so `p="4"` becomes `16px` on each side. CSS lengths and functions can be used when the scale does not fit.

```html
<article p="5" md-p="8" bg="white" rounded="xl">
  <h2 mb="2">Card title</h2>
  <p>Content with space inside the card.</p>
</article>
```

## Logical padding

Use `ps` and `pe` for inline start and end. The longer `padding-inline`, `padding-inline-start`, `padding-inline-end`, `padding-block`, `padding-block-start`, and `padding-block-end` names map directly to CSS logical properties. Logical properties adapt to writing direction; for example, inline start is the right side in right-to-left text.

```html
<blockquote padding-inline="1.5rem" padding-block="1rem" border-inline-start="4px solid">
  Direction-aware inset content
</blockquote>
```

## Shorthand values

The `p` attribute supports CSS-style two- and four-part spacing shorthands. For example, `p="1rem 2rem"` sets block and inline padding, and `p="1rem 2rem 3rem 4rem"` sets top, right, bottom, and left. Use explicit attributes when that is easier to read.

## Attributes

The table lists supported physical and logical padding attributes and their CSS outputs.
