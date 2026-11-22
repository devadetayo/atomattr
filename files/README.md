# AtomAttr

AtomAttr is an HTML-first styling system that uses attributes instead of class strings.

This rebuild makes the HTML engine the source of truth again, then teaches React to emit the same attribute contract. The result is one mental model across:

- plain HTML
- React components
- React web apps
- Vite demos and docs

## What Changed

The old React version had drifted away from the working HTML version. It resolved styles differently, had broken imports, and exposed an API that no longer matched the DOM engine.

The new direction is simpler:

- HTML stays canonical
- React normalizes friendly props back into canonical HTML attributes
- the same parser handles modifiers like `hover-`, `md-`, `dark-`, and `group-hover-`
- docs, homepage, and examples all describe the same contract

## Quick Start

### Vite / React

```bash
npm install
npm run dev
```

Then open:

- `/` for the main bluish AtomAttr homepage
- `/docs.html` for the full docs site
- `/playground.html` for the live playground

In your app entry:

```tsx
import { startAtomAttr } from 'atomattr';
import 'atomattr/defaults.css';

startAtomAttr();
```

Then use the React primitives:

```tsx
import { Box, H1, Txt, Btn, Row } from 'atomattr/react';

export function Hero() {
  return (
    <Box bg="slate-950" text="white" p="8" rounded="3xl" shadow="xl">
      <H1 fontSize="4xl" weight="black">One contract</H1>
      <Txt mt="3" text="slate-300">
        React writes the same AtomAttr attributes the HTML engine understands.
      </Txt>
      <Row mt="6" gap="3" items="center">
        <Btn px="4" py="2" rounded="full" bg="brand-light" text="slate-950">
          Ship it
        </Btn>
      </Row>
    </Box>
  );
}
```

### Plain HTML

```html
<!doctype html>
<html lang="en">
  <head>
    <link rel="stylesheet" href="/src/style-data/defaults.css" />
  </head>
  <body bg="slate-50">
    <section p="8" bg="slate-950" text="white" rounded="3xl" shadow="xl">
      <h1 font-size="4xl" weight="black">HTML stays canonical</h1>
      <p mt="3" text="slate-300">Attributes are the API.</p>
    </section>

    <script type="module">
      import { startAtomAttr } from '/src/index.js';
      startAtomAttr();
    </script>
  </body>
</html>
```

## Canonical Rule

If AtomAttr supports a key in HTML, that HTML key is the source of truth.

Examples:

- `font-size`
- `min-h`
- `grid-cols`
- `border-color`
- `hover-bg`
- `md-p`

React supports that same contract in two ways:

- direct props when the key is JSX-friendly: `bg`, `p`, `text`, `rounded`
- camel aliases when the HTML key needs a dash: `fontSize`, `minH`, `gridCols`, `borderColor`

When React renders, those aliases are converted back to the canonical HTML attributes.

## Examples

### Layout

```html
<div flex gap="4" items="center" justify="between" p="6"></div>
```

```tsx
<Box flex gap="4" items="center" justify="between" p="6" />
```

### Responsive and state

```html
<button
  px="4"
  py="2"
  rounded="full"
  bg="brand"
  text="white"
  hover-bg="slate-900"
  md-px="6"
>
  Continue
</button>
```

### Exact HTML attrs from React

Use `attrs` when you want to pass canonical AtomAttr keys directly:

```tsx
<Box attrs={{ 'font-size': '3xl', 'min-h': 'screen', 'grid-cols': '3' }} />
```

## Important Note

The public site pages now open as normal HTML pages styled with AtomAttr:

- `index.html`
- `docs.html`
- `playground.html`
- `react-demo.html`
- `support.html`
- `sponsors.html`

The React package still exists in `react/` for real app usage, but the website itself no longer depends on loading raw `.tsx` in the browser.

## Included Files

- [index.html](/home/codyconor10/Downloads/atomattr/index.html) is the plain HTML homepage entry
- [docs.html](/home/codyconor10/Downloads/atomattr/docs.html) is the full documentation site
- [playground.html](/home/codyconor10/Downloads/atomattr/playground.html) is the live playground
- [react-demo.html](/home/codyconor10/Downloads/atomattr/react-demo.html) is the React usage/demo page
- [support.html](/home/codyconor10/Downloads/atomattr/support.html) is the support and donation page
- [sponsors.html](/home/codyconor10/Downloads/atomattr/sponsors.html) is the sponsor wall
- [src/index.js](/home/codyconor10/Downloads/atomattr/src/index.js) exports the HTML engine
- [react/index.ts](/home/codyconor10/Downloads/atomattr/react/index.ts) exports the React layer
- [docs/getting-started.md](/home/codyconor10/Downloads/atomattr/docs/getting-started.md) explains the model
- [docs/react.md](/home/codyconor10/Downloads/atomattr/docs/react.md) covers React usage
- [docs/cheatsheet.md](/home/codyconor10/Downloads/atomattr/docs/cheatsheet.md) gives the quick reference

## Core Ideas

- AtomAttr styles are driven by attributes, not generated class names.
- The browser engine scans the DOM and injects the needed CSS rules.
- React does not invent a separate styling engine anymore.
- Responsive, hover, dark, and group modifiers are parsed from the same attribute grammar.
- Inline `style` still works for one-off overrides.

## Semantic Color Overrides

Semantic colors are CSS variables, so applications can change their theme without changing component markup:

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

Use semantic attributes such as `bg="primary"`, `text="foreground"`, and `border-color="border"` in components. The `--aa-color-*` variables override the defaults for both generated AtomAttr rules and your own CSS.

## v1.0.0

See [RELEASE_NOTES.md](RELEASE_NOTES.md) for the launch checklist and supported v1 surface.

## Docs

- [Getting Started](/home/codyconor10/Downloads/atomattr/docs/getting-started.md)
- [React Guide](/home/codyconor10/Downloads/atomattr/docs/react.md)
- [Cheatsheet](/home/codyconor10/Downloads/atomattr/docs/cheatsheet.md)
- [Plain HTML Example](/home/codyconor10/Downloads/atomattr/examples/plain.html)
