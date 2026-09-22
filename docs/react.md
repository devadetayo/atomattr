# React Guide

## Philosophy

React is not a second AtomAttr engine anymore.

The React package now does one job:

- accept AtomAttr-style props
- normalize JSX-friendly aliases like `fontSize` to canonical HTML keys like `font-size`
- render those canonical attributes onto real DOM nodes

The existing HTML engine then styles those nodes the same way it styles plain HTML.

## Imports

```tsx
import { Box, Row, Col, Grid, Card, Badge, H1, H2, Txt, Btn } from 'atomattr/react';
```

## Basic Usage

```tsx
<Box bg="white" p="6" rounded="2xl" shadow="lg">
  <H2 fontSize="2xl" weight="bold">Hello</H2>
  <Txt mt="2" text="slate-600">AtomAttr in React.</Txt>
</Box>
```

## Alias Examples

Use camel aliases for dashed canonical keys:

```tsx
<Box minH="screen" borderColor="slate-200" gridCols="3" />
<H1 fontSize="5xl" lineHeight="tight" />
<Box translateX="8" backdropBlur="10" />
```

These become:

```html
<div min-h="screen" border-color="slate-200" grid-cols="3"></div>
<h1 font-size="5xl" line-height="tight"></h1>
<div translate-x="8" backdrop-blur="10"></div>
```

## Exact Canonical Attrs

If you want the React code to mirror HTML examples exactly, use `attrs`:

```tsx
<Box attrs={{ 'font-size': '5xl', 'min-h': 'screen', 'hover-bg': 'slate-950' }} />
```

## Primitives

Core primitives:

- `Box`
- `Span`
- `Txt`
- `Code`
- `Pre`
- `H1` through `H6`
- `Btn`
- `Link`
- `Img`
- `Section`
- `Header`
- `Footer`
- `Main`
- `Nav`
- `Article`
- `UL`
- `LI`
- `Input`
- `Textarea`
- `Select`
- `Option`

Compound primitives:

- `Row` -> `flex` + `flex-row`
- `Col` -> `flex` + `flex-col`
- `Center` -> `center`
- `Grid` -> `grid`
- `Stack` -> column layout helper
- `Spacer` -> `grow="1"`
- `Divider`
- `Card`
- `Badge`

## Polymorphism

Every `atom()` component supports `as`:

```tsx
<Box as="section" p="6" rounded="2xl" />
```

## Inline Style

Inline `style` still passes through untouched.

Use it for:

- one-off gradients
- calculations you do not want to encode as AtomAttr tokens
- temporary overrides while exploring

```tsx
<Box bg="slate-950" style={{ backgroundImage: 'linear-gradient(135deg, #0f172a, #1d4d4f)' }} />
```
