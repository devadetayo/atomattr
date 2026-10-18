# Values
> Use documented design tokens for common choices or pass a valid CSS value for precision.

## Scale tokens

Some properties resolve short values through Atomattr scales. For example, spacing properties such as `p` map `4` to `16px`; `rounded="xl"` maps to a radius preset; `font-size="2xl"` maps to a font-size preset; and `shadow="md"` maps to a shadow preset. These scales are property-specific: `4` does not mean the same thing for every attribute.

The generated reference tables show the CSS property for each attribute. Use the focused pages for [spacing](spacing-padding.html), [sizing](sizing-width-height.html), [typography](typography-font.html), [colors](colors-backgrounds.html), and [effects](effects-shadow.html) for their value conventions.

## Raw CSS values

When a value is not a token, Atomattr generally passes it through to the mapped CSS property. Use units where CSS expects them, and use valid CSS syntax for functions, keywords, and multi-part values.

```html
<section min-h="calc(100vh - 4rem)" p="1.25rem" bg="linear-gradient(135deg, #0f172a, #2563eb)">
  Precise CSS values
</section>
```

Raw values are still subject to CSS property rules and browser support. Atomattr does not validate every value against the browser's CSS grammar.

## Colors and alpha

Color attributes accept palette names, semantic color names, CSS colors, and supported color functions. Append `/` and an opacity percentage for an alpha color, for example `primary/10` or `white/80`. Values such as `16 / 9` are ratios for `aspect`; the same text should not be assumed to work on unrelated properties.

```html
<div bg="primary/10" text="gray-900" border-color="rgb(20 30 40 / 25%)">
  Color values follow the color property.
</div>
```

## Boolean attributes and bare helpers

Boolean-style dictionary entries can be written bare when the attribute name itself selects the declaration, for example `<div hidden></div>` or `<div flex></div>`. Most property attributes need a value, such as `display="grid"` or `aspect="square"`. Keep native HTML attributes (such as `disabled`, `src`, and `alt`) in their normal HTML roles.
