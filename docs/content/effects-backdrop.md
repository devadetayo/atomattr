# Backdrop filters
> Filter the pixels rendered behind a translucent element.

## Backdrop blur

Use `backdrop-blur` to blur the area behind an element. The element needs a background that allows the backdrop to show through, such as `bg="white/70"`. A fully opaque background hides the filtered pixels.

```html
<header bg="white/75" dark-bg="gray-950/75" backdrop-blur="12px" p="4">
  Translucent navigation surface
</header>
```

## Backdrop filter components

The `backdrop-brightness`, `backdrop-contrast`, `backdrop-grayscale`, `backdrop-hue-rotate`, `backdrop-invert`, `backdrop-opacity`, `backdrop-saturate`, and `backdrop-sepia` attributes compose into `backdrop-filter`. Numeric blur values are pixels; numeric hue rotation values are degrees; the other numeric components are percentages.

## Support and rendering cost

Backdrop filtering support and rendering cost depend on the browser and device. Provide an opaque or lightly translucent fallback surface and test scrolling performance on the devices you support.

## Attributes

The table lists backdrop filter properties and their CSS mappings.
