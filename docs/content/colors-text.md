# Text colors
> Set foreground text and other color properties with tokens or CSS colors.

## Text and color attributes

Use `text` or `color` for an element's foreground color. `text-color` is the explicit CSS property form. Other color attributes in this family include `caret-color` and `accent-color`, which affect form control carets and browser control accents.

```html
<label display="flex" flex-col gap="2" text="gray-900" dark-text="white">
  <span>Email</span>
  <input type="email" accent-color="primary" caret-color="primary">
</label>
```

## Color values

Values may be palette names, semantic tokens such as `primary` or `muted`, raw CSS color values, or alpha forms such as `primary/80`. The `text` attribute is a CSS color mapping in Atomattr, not a font-size utility. Use `font-size` for text size.

## Theme and interaction

Use `dark-text` or `hover-text` when the color should change for a theme or state. Ensure contrast remains readable for all states and themes. Browser-native focus indicators should remain visible unless an accessible replacement is provided.

```html
<a href="/details" text="primary" hover-text="gray-900" dark-hover-text="white">
  Read details
</a>
```

## Attributes

The table lists text and related color attributes and their CSS outputs. Background color attributes are listed on the [Backgrounds](colors-backgrounds.html) page.
