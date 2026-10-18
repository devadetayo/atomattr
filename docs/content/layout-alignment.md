# Alignment
> Align flex and grid items along their main, cross, and track axes.

## Container alignment

Use `justify` for distribution along a flex container's main axis or for grid content distribution. Use `items` to align flex items on the cross axis, and `content` for multiple flex lines or grid tracks. Common aliases include `between` → `space-between`, `center` → `center`, and `start` → `flex-start`.

```html
<header display="flex" items="center" justify="between" gap="4">
  <a href="/">Brand</a><nav>...</nav><button>Sign in</button>
</header>
```

## Grid alignment

Use `justify-items` and `justify-self` for the inline axis in a grid; use `items` and `self` for the block or cross axis. The `place-items`, `place-content`, and `place-self` attributes map to CSS shorthand properties and accept their CSS values.

## Centering a child

`center` is a registered helper that sets `display: flex`, `align-items: center`, and `justify-content: center`. It therefore establishes a flex container itself. For finer control, use `items="center"` and `justify="center"` explicitly. Alignment only works when the selected display mode supports the relevant property.

```html
<div display="grid" place-items="center" min-h="48">
  <p>Centered in both grid axes</p>
</div>
```

## Attributes

The table lists alignment attributes. Their values follow the mapped CSS property, including valid CSS keywords and supported aliases.
