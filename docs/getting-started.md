# Getting Started

## The Model

AtomAttr is HTML-first.

That means the canonical API is the attribute language itself:

- `bg="blue-600"`
- `p="6"`
- `font-size="3xl"`
- `min-h="screen"`
- `hover-bg="slate-950"`
- `md-grid-cols="3"`

React exists to make that model ergonomic, not to replace it.

## How It Works

- The engine scans the DOM for AtomAttr attributes.
- Each attribute is parsed into:
  - a canonical property key
  - an optional modifier chain like `hover`, `md`, `dark`, `group-hover`
  - a value
- AtomAttr generates the CSS rule for that exact attribute/value pair.
- The rule is injected once and reused.

## Canonical Attributes

Canonical means “this is the real key the engine understands.”

Examples:

- `font-size`
- `grid-cols`
- `border-color`
- `translate-x`
- `backdrop-blur`

In HTML, use those names directly.

In React, use:

- the same key when JSX allows it comfortably
- camel aliases when the canonical key has dashes

Examples:

- `fontSize` -> `font-size`
- `gridCols` -> `grid-cols`
- `borderColor` -> `border-color`
- `minH` -> `min-h`

## HTML Setup

Add the defaults stylesheet and start the engine:

```html
<link rel="stylesheet" href="/src/style-data/defaults.css" />

<script type="module">
  import { startAtomAttr } from '/src/index.js';
  startAtomAttr();
</script>
```

### Customize semantic colors

Semantic color attributes resolve through CSS variables. Override the variables after loading the defaults stylesheet to theme an application without changing component markup:

```css
:root {
  --aa-color-primary: #7c3aed;
  --aa-color-surface: #ffffff;
  --aa-color-foreground: #1f2937;
}

html.dark {
  --aa-color-primary: #a78bfa;
}
```

Use them with attributes such as `bg="primary"`, `text="foreground"`, and `border-color="border"`.

## React Setup

Start the engine once near app startup:

```tsx
import { startAtomAttr } from 'atomattr';
import 'atomattr/defaults.css';

startAtomAttr();
```

Then render AtomAttr primitives:

```tsx
import { Box, H2, Txt } from 'atomattr/react';

<Box bg="white" p="6" rounded="2xl" shadow="lg">
  <H2 fontSize="2xl" weight="black">Card title</H2>
  <Txt mt="2" text="slate-600">Same contract, React wrapper.</Txt>
</Box>
```

## Modifiers

Modifiers are prefixes added before the canonical prop key.

Supported groups:

- breakpoints: `sm`, `md`, `lg`, `xl`, `2xl`
- pseudo states: `hover`, `focus`, `focus-visible`, `focus-within`, `active`, `visited`, `disabled`, `checked`, `required`, `invalid`, `first`, `last`, `odd`, `even`
- theme: `dark`
- group state: `group-hover`

Examples:

```html
<button bg="brand" hover-bg="slate-950" md-px="6"></button>

<div group>
  <span group-hover-text="brand"></span>
</div>
```

## Tokens

Common value tokens are built in:

- spacing: `0`, `0.5`, `1`, `2`, `4`, `6`, `8`, `12`, `16`, `24`
- sizes: `full`, `half`, `third`, `quarter`, `fit`, `min`, `max`, `screen`
- radius: `none`, `sm`, `base`, `md`, `lg`, `xl`, `2xl`, `3xl`, `full`
- font sizes: `xs`, `sm`, `base`, `lg`, `xl`, `2xl` through `9xl`
- shadows: `sm`, `base`, `md`, `lg`, `xl`, `2xl`, `inner`, `none`
- colors: Tailwind-style palette names like `slate-900`, `blue-600`, `rose-400`, plus `white`, `black`, `transparent`, `current`, `inherit`

Raw CSS is allowed too:

- `w="320px"`
- `bg="#101828"`
- `gap="2rem"`
- `rotate="12deg"`

## React Escape Hatch

Use `attrs` when you want exact canonical keys instead of aliases:

```tsx
<Box attrs={{ 'font-size': '4xl', 'min-h': 'screen', 'grid-cols': '3' }} />
```

This is useful for:

- copy-pasting from HTML examples
- keeping React snippets visually identical to HTML snippets
- using keys you do not want to camel-case
