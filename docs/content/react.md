# React
> Use Atomattr in React two ways: plain elements with canonical attributes, or the Atomattr primitives with camel-case props. Both emit the same attributes the browser engine reads.

## Install and start

Install `atomattr` alongside React 19, then import `atomattr/defaults.css` once. Importing `atomattr/react` starts the DOM engine in the browser. You can also call `startAtomAttr()` from the main package explicitly; repeated starts are safe.

```tsx
import 'atomattr/defaults.css';
import { Box, H1, Txt, Btn } from 'atomattr/react';

export function Card() {
  return (
    <Box bg="surface" p="6" rounded="xl" border="border">
      <H1 fontSize="3xl" fontWeight="bold">React with AtomAttr</H1>
      <Txt text="muted">Props become canonical HTML attributes.</Txt>
      <Btn mt="4" bg="primary" hoverBg="primary/80">Continue</Btn>
    </Box>
  );
}
```

## Plain elements

React 19 passes unknown lowercase attributes through to the DOM, so canonical Atomattr attributes also work on ordinary JSX elements. Use this when you want markup that matches the HTML docs exactly, or when you copy a component from the UI library.

```tsx
export function Banner() {
  return (
    <section display="flex" flex-col md-flex-row gap="4" p="6" rounded="2xl" bg="surface" border="border">
      <h2 font-size="xl" font-weight="bold">Plain elements</h2>
      <button px="4" py="2" rounded="lg" bg="primary" text="white" hover-bg="primary/80">Continue</button>
    </section>
  );
}
```

A bare attribute such as `flex-col` has to be written with a string value in JSX (`flex-col=""`) because React drops unknown attributes whose value is `true`. The primitives accept the bare form for boolean-style attributes, such as `<Box flex />`.

## Prop names

Simple attributes such as `bg`, `p`, `text`, and `rounded` can be used directly. Dashed attribute names have camel aliases such as `fontSize`, `minH`, `gridCols`, and `borderColor`. Modifier names can be passed with their camel-style aliases where the primitive supports them, for example `hoverBg` or `mdP`. Use `attrs={{ 'font-size': '2xl', 'hover-bg': 'primary/80' }}` to spell exact canonical names.

| HTML attribute | React prop |
| --- | --- |
| `font-size` | `fontSize` |
| `min-h` | `minH` |
| `grid-cols` | `gridCols` |
| `border-color` | `borderColor` |
| `hover-bg` | `hoverBg` |
| `md-p` | `mdP` |

## Primitives

`Box` renders a `div`; `Row` and `Col` are flex row and column containers; `Txt` renders text; `H1`, `H2` and the other heading primitives render headings; `Btn` renders a `button`. Use `as` to change the element when the content needs different semantics, for example `<Box as="section">` or `<Txt as="span">`.

```tsx
import { Row, Col, Txt, Btn } from 'atomattr/react';

export function Toolbar() {
  return (
    <Row gap="3" items="center" justify="between" p="4">
      <Col gap="1">
        <Txt fontWeight="semibold">Project</Txt>
        <Txt text="muted" fontSize="sm">Last edited today</Txt>
      </Col>
      <Btn px="4" py="2" rounded="lg" bg="primary" text="white">Share</Btn>
    </Row>
  );
}
```

## State and dynamic values

Pass state straight into a prop. The engine watches attribute changes and generates the matching rule, so no class juggling is needed. Compute the whole value instead of joining fragments.

```tsx
import { useState } from 'react';
import { Btn } from 'atomattr/react';

export function Toggle() {
  const [on, setOn] = useState(false);
  return (
    <Btn px="4" py="2" rounded="full" text="white" bg={on ? 'emerald-600' : 'gray-500'} onClick={() => setOn(!on)}>
      {on ? 'On' : 'Off'}
    </Btn>
  );
}
```

## Native HTML props and refs

The primitives render semantic HTML elements and accept normal React props for their element type. Choose the appropriate primitive or `as` target for the content, and use native accessibility props such as `aria-label`, `disabled`, and `type` as needed. Use the package types and the [React Native guide](react-native.html) for native apps; browser primitives do not render native views.

## Next.js and server rendering

The engine runs in the browser. Import `atomattr/defaults.css` in the root layout and start the engine from a client component, as shown in the [installation guide](installation.html). Server-rendered markup is unstyled until the engine starts, so test first paint on a slow connection.
