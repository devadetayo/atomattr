# Weight, line height, and spacing
> Control font weight, line height, letter spacing, and word spacing.

## Font weight

Use `weight` or `font-weight` with named tokens from `thin` through `black`, or pass a numeric CSS weight such as `450` when the chosen font supports it. A browser may synthesize weights that are not present in the loaded font.

## Line height

Use `leading` or `line-height` with tokens such as `tight`, `normal`, `relaxed`, and `loose`, or pass a valid CSS number or length. Unitless values scale with the font size and are generally useful for text blocks.

```html
<p font-size="lg" weight="medium" leading="relaxed" max-w="60ch">
  Comfortable line height makes this longer paragraph easier to read.
</p>
```

## Letter and word spacing

Use `tracking` or `letter-spacing` for letter spacing and `word-spacing` for space between words. Values follow CSS, including tokens such as `wide` and `tight` for letter spacing or explicit lengths. Use increased tracking carefully for long passages because it can reduce readability.

## Attributes

The table lists weight, line-height, and spacing attributes. Font family and size are covered in [Font family and size](typography-font.html).
