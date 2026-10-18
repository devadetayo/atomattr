# Syntax
> Put the styling property in the attribute name and its CSS value in the attribute value.

## Base attributes

Atomattr recognizes registered styling attributes on HTML elements. The attribute name selects a CSS property or a supported shorthand; the value provides a token, keyword, or CSS value. For example, `p="4"` selects padding and resolves the spacing token, while `bg="primary"` selects a background color.

```html
<button px="4" py="2" bg="primary" text="white" rounded="lg">
  Save
</button>
```

## Prefixes

Modifiers are prefixes on the property attribute name: `md-p`, `hover-bg`, `dark-text`, `group-hover-opacity`, `cq-md-grid-cols`, and `before-content`. Breakpoints and container queries wrap a rule; theme, group, state, and pseudo-element modifiers alter its selector. Only registered property names and supported modifiers are parsed.

```html
<article p="4" md-p="8" bg="white" dark-bg="gray-900" hover-shadow="lg">
  The same element can respond to several contexts.
</article>
```

Prefixes can be composed, for example `md-dark-hover-bg`. Modifier parsing uses hyphens, so use the documented order shown in examples when combining prefixes.

## HTML names and framework props

In HTML, use the registered canonical name, usually lower-case and dashed: `font-size`, `min-h`, `grid-cols`, and `border-color`. React primitives provide camel-case aliases for names that JSX cannot conveniently express, then normalize them to canonical HTML attributes. For exact or less common names, use the React `attrs` escape hatch. See the [React guide](react.html).

Unknown styling names do not generate rules. Native attributes such as `href`, `alt`, `disabled`, `src`, `role`, and event handlers retain their normal platform meaning.

## Limits

Atomattr generates CSS for the properties in its dictionary. It does not accept arbitrary property names, CSS selectors, or a class-string grammar. The browser still determines whether a CSS value or modern feature is valid and supported. Use ordinary CSS for rules that need selectors or conditions outside the documented modifiers.
