# Gradients
> Set a CSS gradient as a background image, or provide gradient stop values for your own CSS.

## Direct gradient values

Use `bg-gradient` with a valid CSS gradient function to set `background-image`. This attribute does not synthesize gradient CSS from separate stops; it passes the value through to the browser.

```html
<section bg-gradient="linear-gradient(135deg, #4338ca, #06b6d4)" text="white" p="8" rounded="2xl">
  Gradient surface
</section>
```

## Stop attributes

`from`, `via`, and `to` set the CSS custom properties `--aa-from`, `--aa-via`, and `--aa-to`. They do not create a background by themselves. Use them only if your own stylesheet references those variables.

```html
<div from="blue" via="purple" to="pink" class="custom-gradient">
  A project stylesheet can consume the Atomattr stop variables.
</div>
```

```css
.custom-gradient {
  background-image: linear-gradient(90deg, var(--aa-from), var(--aa-via), var(--aa-to));
}
```

## Browser support and values

CSS supports linear, radial, conic, and repeating gradient functions in modern browsers. Atomattr does not validate function syntax, color stops, or browser support. Use `bg-image` when you want to set any background image value directly.

## Attributes

The table lists gradient-related attributes. `bg-gradient` maps to `background-image`; `from`, `via`, and `to` are custom-property helpers.
