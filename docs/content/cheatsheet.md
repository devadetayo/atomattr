# Cheatsheet
> Every registered Atomattr key in one place.

## All attributes

The searchable attribute table is generated directly from the registered dictionary and lists every supported styling name with its CSS output. Use it to check the exact spelling before adding a styling attribute.

<!-- atomattr:attribute-table -->

Browse every registered styling attribute and the CSS property it controls. Use the filter to find an attribute by name or look up a CSS property. Boolean helper attributes such as `flex`, `hidden`, and `object-cover` are listed by their canonical names.

## Modifiers

Add a modifier prefix before any supported attribute to apply it at a viewport breakpoint, inside a size container, for a theme, or during an element state. Container variants (`cq-sm`, `cq-md`, `cq-lg`, and `cq-xl`) query the nearest eligible ancestor marked with `container="name / inline-size"`. The generated query currently uses its minimum width threshold and does not select the container by name.

```html
<section container="card / inline-size">
  <article grid-cols="1" cq-md-grid-cols="2" aspect="video">
    ...
  </article>
</section>
```
