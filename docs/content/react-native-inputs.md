# React Native inputs
> Style native text inputs while preserving their value, event, and accessibility behavior.

## Text input

Use the exported `Input` primitive, which wraps React Native's `TextInput`. Pass normal input props such as `placeholder`, `value`, and `onChangeText` alongside supported style props. Use a visible label or an accessible label for each field.

```tsx
import { Box, Input, Txt } from 'atomattr/react-native';

export function LoginForm() {
  return (
    <Box gap="2" p="6">
      <Txt fontWeight="semibold">Email</Txt>
      <Input
        accessibilityLabel="Email address"
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="name@example.com"
        p="3"
        border="1px solid gray-300"
        rounded="lg"
      />
    </Box>
  );
}
```

## Native property support

The React Native style engine translates supported AtomAttr tokens into native style values. Browser-only properties, CSS pseudo-state prefixes, generated CSS rules, and `defaults.css` do not apply to native inputs. Check the installed native engine and component types for the supported input props.

## Accessible states

Use native input properties for keyboard type, capitalization, secure text entry, and value handling. Associate the field with a clear label and communicate validation errors in text, not only through a color or border change.
