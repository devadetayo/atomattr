# Backgrounds
> Set an element's background color, image, sizing, position, repeat, or attachment.

## Background colors

Use `bg` or `bg-color` to set the background color. Values can be named palette colors, semantic tokens, CSS colors, or supported alpha colors such as `primary/10`. Pair a base color with a `dark-bg` value when a component needs an explicit dark-theme surface.

```html
<section bg="white" dark-bg="gray-900" text="gray-950" dark-text="white" p="6">
  Theme-aware surface
</section>
```

## Background images

Use `bg-image` for an image URL or gradient image. `bg-size`, `bg-position`, `bg-repeat`, and `bg-attachment` map to the matching CSS background properties. Values follow CSS, for example `cover`, `center`, `no-repeat`, or `fixed`.

```html
<section bg-image="url('/hero.jpg')" bg-size="cover" bg-position="center" bg-repeat="no-repeat" min-h="60">
  <h1 text="white">Hero content</h1>
</section>
```

## Clipping and origin

`bg-clip` and `bg-origin` control the background painting area and positioning area. These CSS properties are useful for borders and text effects, but require valid browser CSS values. `bg` is the background color property; it does not set background images.

## Attributes

The table lists background-related attributes. For gradient stop variables and direct gradient values, see [Gradients](colors-gradients.html).
