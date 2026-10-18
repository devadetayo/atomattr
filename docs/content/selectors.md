# Selectors and states
> AtomAttr variants generate selectors from a constrained, readable prefix grammar.

## Supported pseudo-class prefixes

Supported state prefixes include `hover`, `focus`, `focus-visible`, `focus-within`, `active`, `visited`, `disabled`, `checked`, `indeterminate`, `required`, `optional`, `valid`, `invalid`, `read-only`, `read-write`, `placeholder-shown`, `open`, `selected`, `empty`, `only`, `first`, `last`, `odd`, `even`, `first-of-type`, and `last-of-type`. Prefixes compose with viewport, dark, and container-size variants. `selected` currently aliases `:checked`; it does not target selected `<option>` elements.

```html
<button hover-bg="primary/90" focus-visible-outline="2px" focus-visible-outline-color="primary" active-scale="0.98" disabled-opacity="50">Save</button>
<li odd-bg="gray-50" even-bg="white">Activity item</li>
<input required invalid-border-color="red-600" placeholder-shown-text="gray-500">
```

## Composition rules

Prefixes are separated by hyphens and resolved against registered names, so longer prefixes such as `focus-visible` are recognized as one modifier. Examples include `md-hover-bg`, `dark-focus-visible-outline`, and `md-cq-lg-hover-bg`.

The engine builds an attribute selector for the full prefixed attribute name, then appends supported state pseudo-classes. Use the complete modifier-prefixed name in markup; the state prefix is not removed from the HTML attribute.

## Selector features not exposed yet

Arbitrary `:has()`, `:is()`, `:where()`, `:not()`, descendant or sibling combinators, and custom selector strings are not supported by the attribute parser. Use regular CSS for these selectors. This avoids claiming a selector syntax that the engine cannot safely parse or generate.
