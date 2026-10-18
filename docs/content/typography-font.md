# Font family and size
> Choose a font family and set text size with CSS font attributes.

## Font families

Use `font` or `family` to set `font-family`. Pass a CSS font stack, including quotes around family names that contain spaces and a generic fallback at the end. These values are passed through; Atomattr does not download or register font files.

```html
<h1 font="'Inter', system-ui, sans-serif" font-size="4xl" weight="bold">
  A clear page heading
</h1>
```

## Font size

Use `font-size` or `text-size` with a scale token from `xs` through `9xl`, or pass a CSS length such as `1.125rem` or `clamp(...)`. Font size alone does not set line height or weight; use `leading` and `weight` for those properties.

```html
<p font-size="base" md-font-size="lg" leading="relaxed">
  Body copy scales at the medium viewport breakpoint.
</p>
```

## Accessibility and layout

Choose sizes that remain readable when users zoom text or change browser defaults. Large fixed sizes can overflow narrow layouts; responsive sizes or `clamp()` can help where they fit the design.

## Attributes

The table lists font-family and font-size attributes. See [Weight and line height](typography-weight-line.html) for related typography properties.
