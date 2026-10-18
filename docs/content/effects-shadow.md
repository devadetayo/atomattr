# Shadows
> Apply CSS box shadows, text shadows, or drop-shadow filters.

## Box shadows

Use `shadow` with a preset from `sm` through `2xl`, `inner`, or `none`; raw CSS box-shadow values are also accepted. Shadows can add depth to a card or separate a floating surface from the page. Keep them subtle enough that they do not replace meaningful borders or contrast.

```html
<article bg="white" rounded="2xl" shadow="lg" p="6">
  A raised surface
</article>
```

## Text and drop shadows

`text-shadow` maps to the CSS text-shadow property. `drop-shadow` maps to the CSS `filter` property, so its value must be a full CSS filter function such as `drop-shadow(0 2px 4px rgb(0 0 0 / 20%))`. Do not pass a box-shadow preset to `drop-shadow`.

## Shadow color

The `shadow-color` attribute maps to the package's `--tw-shadow-color` custom property. AtomAttr's current box-shadow presets do not consume that variable, so use a complete `shadow` value when you need to control shadow color, blur, and spread.

## Attributes

The table lists shadow, text-shadow, drop-shadow, and shadow-color attributes with their CSS mappings.
