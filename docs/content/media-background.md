# Background images
> Use CSS background properties for decorative or cropped image surfaces.

## Set an image

Use `bg-image` with `url(...)` or a CSS gradient to set `background-image`. Background images are decorative and are not exposed as image content to assistive technology, so do not use them as the only presentation of important information.

```html
<section bg-image="url('/hero.jpg')" bg-size="cover" bg-position="center" min-h="60">
  <h1>Text remains real page content</h1>
</section>
```

## Size, position, and repeat

Use `bg-size="cover"` to fill the box while cropping as needed, or `contain` to show the full image. `bg-position` controls the crop focus; `bg-repeat` controls tiling. These values follow CSS background properties.

## Attachment and accessibility

`bg-attachment` accepts CSS values such as `scroll`, `fixed`, and `local`; fixed backgrounds can behave differently on mobile and may affect performance. For meaningful imagery, use an `<img>` with appropriate alternative text and the [object fit](media-object.html) attributes.

## Attributes

The table lists background image, size, position, repeat, and attachment attributes.
