# React
> Use AtomAttr React primitives to normalize JSX props into the browser engine's canonical attributes.

## Install and start

Install `atomattr` and `react` / `react-dom` in the app, then import `atomattr/defaults.css` once. Importing `atomattr/react` starts the DOM engine in the browser. You can also call `startAtomAttr()` from the main package explicitly; repeated starts are safe.

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

## Prop names

Simple attributes such as `bg`, `p`, `text`, and `rounded` can be used directly. Dashed attribute names have camel aliases such as `fontSize`, `minH`, `gridCols`, and `borderColor`. Modifier names can be passed with their camel-style aliases where the React primitive supports them. Use `attrs={{ 'font-size': '2xl', 'hover-bg': 'primary/80' }}` to spell exact canonical names.

## Native HTML props and refs

The primitives render semantic HTML elements and accept normal React props for their element type. Choose the appropriate primitive or `as` target for the content, and use native accessibility props such as `aria-label`, `disabled`, and `type` as needed. Use the package types and [React Native guide](react-native.html) for native apps; browser primitives do not render native views.
