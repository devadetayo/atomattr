# State attributes
> State prefixes map to supported CSS pseudo-classes for interaction, form validation, and child position.

## Interactive states

Use state prefixes when a style should apply only during interaction or validation.

```html
<button bg="primary" hover-bg="primary/80" focus-visible-outline="2px" focus-visible-outline-color="primary" disabled-opacity="50">
  Continue
</button>
```

## Structural states

Use `first`, `last`, `odd`, and `even` when repeated elements need alternating or edge styling.

The parser also registers `first-of-type`, `last-of-type`, `only`, and `empty`. These map to structural pseudo-classes such as `:first-of-type`, `:only-child`, and `:empty`.

```html
<li odd-bg="gray-50" even-bg="white" first-rounded-t="lg" last-rounded-b="lg">
  Row item
</li>
```

## Form states

Form controls can use `checked`, `selected`, `required`, `optional`, `valid`, `invalid`, `read-only`, `read-write`, `indeterminate`, `placeholder-shown`, and `open` where the browser exposes those states. In the current parser, `selected` is an alias for `:checked` (use it for checked controls such as radios and checkboxes); it does not select an `<option>`. For a selected option, style the `<option>` directly with a base attribute or use application logic/CSS.

```html
<label>Work email
  <input type="email" required invalid-border-color="red-600" valid-border-color="emerald-600" placeholder-shown-text="gray-500">
</label>
```
