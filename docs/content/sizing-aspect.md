# Aspect ratio
> Set a preferred width-to-height ratio for media, cards, and other boxes.

## How the ratio works

The `aspect` attribute maps to CSS `aspect-ratio`. A ratio of `16 / 9` means the width is sixteen parts for every nine parts of height. The browser uses that preference to calculate a missing dimension; an explicitly constrained width and height can take precedence.

```html
<img src="cover.jpg" alt="Mountain landscape" w="full" aspect="video" object="cover">
<div aspect="square" bg="gray-100">Square tile</div>
```

## Presets and custom ratios

Use `aspect="video"` for `16 / 9` or `aspect="square"` for `1 / 1`. You can also pass a CSS ratio such as `4 / 3`, `3 / 2`, `2 / 1`, or `1`. Other CSS ratio values and functions are passed through to the browser.

```html
<iframe src="..." title="Product demo" w="full" aspect="video"></iframe>
<article w="full" aspect="4 / 3" overflow="hidden" rounded="xl">
  Product image or card content
</article>
```

For replaced elements such as `img` and `video`, combine `aspect` with `object="cover"` or `object="contain"` to control how the media fills its box. A ratio alone does not crop the image.

## Responsive ratios

Because `aspect` is a CSS property attribute, it supports viewport, container, theme, and state prefixes where those modifiers make sense. A responsive ratio is useful when the available layout changes shape at a breakpoint.

```html
<div w="full" aspect="square" md-aspect="video" bg="gray-200">
  Square on narrow screens, widescreen on larger screens.
</div>
```

## Attribute

The table below lists the canonical attribute and the CSS property it controls. Values follow CSS `aspect-ratio`, with the `video` and `square` presets described above.
