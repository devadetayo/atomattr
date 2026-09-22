# AtomAttr Cheatsheet

## Spacing

- `p` `pt` `pb` `pl` `pr`
- `px` `py`
- `m` `mt` `mb` `ml` `mr`
- `mx` `my`
- `gap` `gap-x` `gap-y`

Examples:

```html
<div p="6" px="8" mt="4" gap="3"></div>
<section p="5" rounded="xl" shadow="md"></section>
```

## Sizing

- `w` `h`
- `min-w` `max-w`
- `min-h` `max-h`
- `size`
- `aspect`

Tokens:

- `full`
- `half`
- `third`
- `quarter`
- `fit`
- `min`
- `max`
- `screen`

Examples:

```html
<div w="full" min-h="screen"></div>
<div size="12" rounded="full"></div>
<img w="64" h="64" object-cover alt="Avatar" />
```

## Layout

- `flex`
- `flex-row` `flex-col`
- `items`
- `justify`
- `self`
- `content`
- `grow` `shrink` `basis`
- `wrap` `no-wrap`
- `grid`
- `grid-cols` `grid-rows`
- `col-span` `row-span`

Examples:

```html
<div flex flex-col gap="4"></div>
<div grid grid-cols="3" gap="4"></div>
<div display="flex" items="center" justify="between"></div>
```

## Position

- `relative`
- `absolute`
- `fixed`
- `sticky`
- `top` `right` `bottom` `left`
- `inset` `inset-x` `inset-y`
- `z`

## Color

- `bg`
- `text`
- `color`
- `border-color`
- `outline-color`
- `fill`
- `stroke`
- `caret-color`
- `accent-color`

Examples:

```html
<div bg="blue-600" text="white" border-color="blue-800"></div>
```

## Typography

- `font-size`
- `weight`
- `leading`
- `tracking`
- `align`
- `font`
- `decoration`
- `text-transform`
- `whitespace`
- `italic`
- `underline`
- `line-through`
- `truncate`

Examples:

```html
<h1 font-size="5xl" weight="black" leading="tight"></h1>
<p text="slate-600" font-size="lg"></p>
```

## Border and Radius

- `border`
- `border-width`
- `border-style`
- `border-color`
- `border-t` `border-b` `border-l` `border-r`
- `rounded`
- `rounded-t` `rounded-b` `rounded-l` `rounded-r`
- `rounded-tl` `rounded-tr` `rounded-bl` `rounded-br`
- `outline`
- `outline-color`
- `outline-style`
- `outline-offset`

Radius tokens:

- `none`
- `sm`
- `base`
- `md`
- `lg`
- `xl`
- `2xl`
- `3xl`
- `full`

## Effects

- `shadow`
- `opacity`
- `blur`
- `brightness`
- `contrast`
- `grayscale`
- `hue-rotate`
- `invert`
- `saturate`
- `sepia`
- `backdrop-blur`

## Transform

- `scale`
- `scale-x`
- `scale-y`
- `rotate`
- `translate-x`
- `translate-y`
- `translate-z`
- `skew-x`
- `skew-y`

Examples:

```html
<div rotate="6" translate-y="2"></div>
```

## Modifiers

Breakpoints:

- `sm-`
- `md-`
- `lg-`
- `xl-`
- `2xl-`

States:

- `hover-`
- `focus-`
- `focus-visible-`
- `focus-within-`
- `active-`
- `disabled-`
- `checked-`
- `required-`
- `invalid-`
- `first-`
- `last-`
- `odd-`
- `even-`

Theme:

- `dark-`

Group:

- `group-hover-`

Examples:

```html
<button bg="brand" hover-bg="slate-950" md-px="6"></button>
<div dark-bg="gray-900" dark-text="white"></div>

<div group>
  <span group-hover-text="brand"></span>
</div>
```

## React Alias Examples

- `fontSize` -> `font-size`
- `minH` -> `min-h`
- `gridCols` -> `grid-cols`
- `borderColor` -> `border-color`
- `translateX` -> `translate-x`
- `backdropBlur` -> `backdrop-blur`

## React Exact Attr Escape Hatch

```tsx
<Box attrs={{ 'font-size': '4xl', 'min-h': 'screen', 'hover-bg': 'slate-950' }} />
```
