# Width and height
> Set an element's width, height, or equal dimensions with CSS sizing properties.

## Width and height

Use `w` and `h` to set width and height. Numeric values such as `w="64"` use the spacing scale; common sizing tokens include `full`, `half`, `third`, `quarter`, `fit`, `min`, `max`, and `screen`. Raw values such as `20rem`, `50%`, `min(100%, 40rem)`, and `calc(...)` are also passed to CSS.

```html
<img src="avatar.jpg" alt="Profile" w="16" h="16" rounded="full" object="cover">
<main w="full" max-w="72rem" mx="auto">Page content</main>
```

## Equal dimensions

Use `size` when an element should have the same width and height, such as an icon button or avatar. It maps to the CSS `width` and `height` properties. For a square shape that should preserve its proportion when only one dimension is set, use `aspect="square"` instead.

```html
<button size="12" display="grid" place-items="center" rounded="full" aria-label="Add">
  <span aria-hidden="true">+</span>
</button>
```

## Constrain the result

Use the min/max sizing attributes when content or its parent should limit the chosen size. Percentage dimensions depend on the relevant containing block, and `h="full"` may require a parent with a definite height. Viewport units can be affected by mobile browser chrome; consider `dvh` or `svh` where appropriate.

## Attributes

The table lists width, height, and equal-size attributes. Values follow CSS length and sizing rules, with scale tokens resolved by Atomattr.
