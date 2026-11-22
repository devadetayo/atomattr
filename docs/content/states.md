# State attributes
> State prefixes map to CSS pseudo-classes for interaction, validation and position in a list.

## Interactive states

Use a state prefix when a style should apply only during interaction or while a form control is in a given state. The full list of prefixes is in [Selectors and states](selectors.html).

```html
<button bg="primary" text="white" px="4" py="2" rounded="lg" hover-bg="primary/80" focus-visible-outline="2px" focus-visible-outline-color="primary" disabled-opacity="50">
  Continue
</button>
```

## Structural states

Use `first`, `last`, `odd` and `even` when repeated elements need alternating or edge styling.

```html
<li odd-bg="gray-50" even-bg="white" first-rounded-t="lg" last-rounded-b="lg">
  Row item
</li>
```

## Form states

Controls can use `checked`, `required`, `invalid` and `disabled`. For `valid`, `placeholder-shown` and `read-only`, write a CSS rule, since those prefixes are not registered in 1.0.1.

```html
<label>Work email
  <input type="email" required invalid-border-color="red-600" border="1px solid gray-300" rounded="lg" p="2">
</label>
```
