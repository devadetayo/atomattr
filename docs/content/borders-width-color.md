# Border width, style, and color
> Draw borders on all sides, selected sides, or logical edges.

## Border shorthand

Use `border` with a width, style, and optional color, for example `border="1px solid gray-200"`. A bare `border` uses the browser's current border defaults, so pair it with `border-color` and width/style attributes when you need a specific result. `border-width`, `border-style`, and `border-color` can also be set independently.

```html
<article border="1px solid gray-200" dark-border="1px solid gray-700" rounded="xl" p="5">
  Card content
</article>
```

## Sides and logical edges

Use `border-t`, `border-r`, `border-b`, and `border-l` for physical sides; `border-x` and `border-y` set paired sides. Logical attributes such as `border-inline-start` adapt to writing direction. Side-specific color attributes let a border edge differ from the rest.

## CSS values

Widths use CSS lengths or supported scale values. Styles include `solid`, `dashed`, `dotted`, `double`, `none`, and `hidden`. Colors accept palette/semantic tokens or CSS color values. A shorthand with multiple parts is parsed by Atomattr into width, style, and color where those parts are recognized.

## Attributes

The table lists registered border shorthands, edges, styles, and colors and their CSS outputs.
