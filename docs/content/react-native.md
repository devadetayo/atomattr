# React Native
> Build native interfaces with AtomAttr's React Native primitives and style engine.

## Install and import

Install AtomAttr in a React Native project using the package manager supported by your app setup. Import native primitives from `atomattr/react-native`; do not load the browser engine or `defaults.css` in a native screen.

```tsx
import { Box, Txt, Btn, Row } from 'atomattr/react-native';

export function ProfileScreen() {
  return (
    <Box flex={1} bg="gray-50" p="6">
      <Row gap="3" items="center">
        <Box size="14" rounded="full" bg="primary" />
        <Txt fontSize="2xl" fontWeight="bold">Ada Lovelace</Txt>
      </Row>
      <Btn mt="5" bg="primary">Follow</Btn>
    </Box>
  );
}
```

## Native style model

The native engine translates supported attributes into React Native style objects. It shares some naming and token ideas with the browser package, but CSS-only features such as selectors, media queries, container queries, pseudo-elements, and arbitrary CSS functions do not automatically translate.

## Components and support

The package includes native primitives and input wrappers. Check the [layout guide](react-native-layout.html) and [input guide](react-native-inputs.html), along with TypeScript definitions in the installed version, for the supported props and value forms. Test behavior on both iOS and Android when platform support differs.
