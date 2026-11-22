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

```native
import { Box, Txt } from 'atomattr/react-native';

export function Card() {
  return (
    <Box p="5" bg="white" rounded="xl">
      <Txt fontWeight="bold" mb="2">Card title</Txt>
      <Txt>Content with space inside the card.</Txt>
    </Box>
  );
}
```

## Start and end padding

Use `ps` and `pe` for inline start and end padding. They follow the writing direction, so inline start is the right side in right-to-left text.

```html
<blockquote px="6" py="4" border-l="4" border-color="primary">
  Direction-aware inset content
</blockquote>
```

## Shorthand values

The `p` attribute supports CSS-style two- and four-part spacing shorthands. For example, `p="1rem 2rem"` sets block and inline padding, and `p="1rem 2rem 3rem 4rem"` sets top, right, bottom, and left. Use explicit attributes when that is easier to read.

## Attributes

The table lists supported padding attributes and their CSS outputs.
