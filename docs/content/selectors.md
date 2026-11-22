# Selectors and states
> The prefixes Atomattr 1.0.1 understands: breakpoints, dark mode, group hover, element states and the before and after pseudo-elements.

## Supported prefixes

Put a prefix before any registered attribute. Prefixes can be combined, such as `md-hover-bg` or `dark-hover-text`.

<!-- atomattr:states -->

Other prefixes: `sm-`, `md-`, `lg-`, `xl-` and `2xl-` for viewport width, `dark-` for the dark theme, `group-hover-` for a parent marked with the `group` attribute, and `before-` and `after-` for pseudo-elements.

```html
<ul>
  <li odd-bg="gray-50" even-bg="white" first-rounded-t="lg" last-rounded-b="lg" p="3">Row item</li>
  <li odd-bg="gray-50" even-bg="white" first-rounded-t="lg" last-rounded-b="lg" p="3">Row item</li>
</ul>
```

## Not supported

There is no prefix for `valid`, `placeholder-shown`, `read-only`, `empty`, `only`, `first-of-type`, `last-of-type`, `optional`, `indeterminate` or `open`, and no `aria-` or `data-` variants. Write those few rules in CSS with a normal selector, or toggle an attribute from your own code and style the result.

## Group hover

Mark the parent with `group`, then style a child with `group-hover-`.

```html
<a href="/docs" group display="flex" items="center" gap="2" p="3" rounded="lg" hover-bg="gray-100">
  Read the docs
  <span group-hover-translate-x="1" transition="all" duration="150ms">→</span>
</a>
```
