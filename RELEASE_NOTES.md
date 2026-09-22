# Atomattr v1.0.0

## Launch status

Atomattr v1.0.0 is ready for the first public launch as an HTML-first attribute styling engine with matching React and React Native primitives.

## Included

- Attribute-driven layout, spacing, sizing, color, typography, borders, effects, state, responsive, and scroll utilities.
- Canonical CSS property attributes, including `scroll-snap-type`, scroll margin, scroll padding, and scroll snap controls.
- Semantic colors exposed through overridable `--aa-color-*` CSS variables.
- Plain HTML, React, and React Native usage paths with shared naming conventions.
- Documentation, cheatsheet, search, examples, and a live playground with working local assets.
- Automated Node test coverage and a production Vite build.

## Quick start

```html
<link rel="stylesheet" href="/src/style-data/defaults.css" />
<script type="module">
  import { startAtomAttr } from '/src/index.js';
  startAtomAttr();
</script>

<button bg="primary" text="white" px="4" py="2" rounded="lg">
  Launch
</button>
```

## Verification

```bash
npm test
npm run build
```

The build may leave external font and icon URLs for the browser to resolve at runtime; these do not block the bundle.
