# Object fit and position
> Control how images, videos, and other replaced content fill their boxes.

## Fit behavior

Use `object` or `object-fit` with `cover`, `contain`, `fill`, `none`, or `scale-down`. `cover` fills the box while cropping excess content; `contain` shows the complete media and may leave empty space; `fill` may distort the media. Helpers such as bare `object-cover` select a common fit value.

```html
<img src="cover.jpg" alt="Product" w="full" aspect="video" object="cover" object-position="center">
```

## Object position

Use `object-position` to choose which part of a cropped image remains visible, for example `top`, `center`, or `right center`. It has visible effect when the media box and intrinsic image ratio differ, such as when `object-fit="cover"` crops the source.

## Intrinsic ratio and accessible media

Use `aspect` to reserve a box ratio and `object-fit` to control media inside that box. Keep meaningful `alt` text on images; decorative images should use `alt=""`. Give videos controls and an accessible name or captions when their content needs to be understood.

## Attributes

The table lists object fit and position attributes. Aspect ratios are covered in [Aspect ratio](sizing-aspect.html).
