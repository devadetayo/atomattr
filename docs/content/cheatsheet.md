# Cheatsheet
> Every registered Atomattr key in one place.

## All attributes

The searchable attribute table is generated directly from the registered dictionary and lists every supported styling name with its CSS output. Use it to check the exact spelling before adding a styling attribute.

<!-- atomattr:attribute-table -->

Browse every registered styling attribute and the CSS property it controls. Use the filter to find an attribute by name or look up a CSS property. Boolean helper attributes such as `flex`, `hidden`, and `object-cover` are listed by their canonical names.

## Modifiers

Add a modifier prefix before any supported attribute to apply it at a viewport breakpoint, for a theme, or during an element state.

```html
<article grid-cols="1" md-grid-cols="2" dark-bg="gray-900" hover-shadow="lg" aspect="video">
  ...
</article>
```
