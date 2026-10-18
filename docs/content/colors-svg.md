# SVG colors and strokes
> Set SVG fill, stroke color, and stroke geometry on SVG elements.

## Fill and stroke colors

Use `fill` and `stroke` to set SVG paint values. They accept palette colors, raw CSS colors, and SVG paint keywords such as `none` and `currentColor`. SVG elements inherit these properties, so values can often be set on a parent `<svg>` and overridden on a child. The engine's dark-mode color resolver also supports semantic color tokens here.

```html
<svg viewBox="0 0 24 24" fill="none" stroke="primary" stroke-width="2" aria-hidden="true">
  <path d="M4 12h16" stroke-linecap="round" />
</svg>
```

## Stroke geometry

Use `stroke-width`, `stroke-linecap`, `stroke-linejoin`, `stroke-dasharray`, and `stroke-dashoffset` for line weight, end caps, joins, and dashed patterns. Values follow SVG and CSS rules; for example, `stroke-linecap="round"` and `stroke-dasharray="4 2"`.

## Color and inheritance

`currentColor` uses the element's computed text color, which can be styled with `text` or `color`. This is useful for icons that should match nearby text. A descendant's explicit SVG paint value overrides inherited paint from its parent.

## Attributes

The table lists SVG paint and stroke geometry attributes. For standard HTML foreground and background colors, see the [color references](colors-text.html).
