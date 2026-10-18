# React Native layout
> Use the native layout properties and supported helpers exposed by AtomAttr's React Native entry.

## Flex layout

React Native uses flexbox for layout. Import native primitives from `atomattr/react-native`; browser attributes and `defaults.css` are not involved. `Row` provides a row-oriented helper, while `Box` accepts supported native style props such as `flex`, spacing, alignment, and colors.

```tsx
import { Box, Row, Txt } from 'atomattr/react-native';

export function StatsRow() {
  return (
    <Row gap="3" items="center" justify="between">
      <Box flex={1} p="4" rounded="xl" bg="white">
        <Txt text="muted">Revenue</Txt>
        <Txt fontSize="2xl" fontWeight="bold">$12k</Txt>
      </Box>
      <Box flex={1} p="4" rounded="xl" bg="white"><Txt>Orders</Txt></Box>
    </Row>
  );
}
```

## Gap and grid helpers

React Native versions differ in support for `gap`, and the package includes grid helpers for layouts that need a predictable column structure. Follow the supported APIs in the installed package version and test on the platforms you ship; web CSS container queries, pseudo-states, and browser-only properties are not available in native styles.

## Platform limits

Native style values and properties differ from CSS. Use the React Native reference pages for supported mappings, and inspect the native style engine when a property is not documented. Do not assume every browser AtomAttr attribute works in React Native.
