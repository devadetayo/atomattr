# Border radius
> Round an element's corners with uniform, side, or individual-corner radii.

## Radius scale

Use `rounded` or `radius` to set all corners. Presets range from `none` through `3xl`, with `full` for a pill or circular edge. CSS lengths such as `1rem` can also be used. A circle requires a square box; radius alone does not make a rectangular image circular.

```html
<img src="avatar.jpg" alt="Profile" size="16" object="cover" rounded="full">
<article rounded="2xl" border="border" p="5">Card</article>
```

## Individual corners and edges

Use `rounded-t`, `rounded-b`, `rounded-l`, and `rounded-r` for paired physical corners. Use `rounded-tl`, `rounded-tr`, `rounded-bl`, and `rounded-br` for individual physical corners. Logical corners `rounded-ss`, `rounded-se`, `rounded-es`, and `rounded-ee` follow writing direction.

## Responsive shapes

Radius is a normal CSS property, so it can use viewport and state modifiers when useful. For example, a card may have a smaller radius on a compact screen and a larger radius on a wide layout.

```html
<article rounded="lg" md-rounded="2xl" border="border">Responsive corner radius</article>
```

## Attributes

The table lists corner and edge radius attributes. Values follow CSS `border-radius` rules with the common AtomAttr radius scale.
