# Container queries
> Apply descendant styles when the nearest query container reaches a registered width.

## Declare the container

Use `container="card / inline-size"` on an ancestor to set its container name and query type. You can also use the native `container-name` and `container-type` attributes separately. An inline-size container establishes the width context needed by AtomAttr's size modifiers.

```html
<section container="card / inline-size" p="4" border="border">
  <article display="grid" grid-cols="1" cq-md-grid-cols="2" gap="4">
    <img src="cover.jpg" alt="" aspect="video" object="cover">
    <div><h2 text-wrap="balance">A component that follows its parent width</h2></div>
  </article>
</section>
```

## Size modifiers

The registered modifiers are `cq-sm` (640px), `cq-md` (768px), `cq-lg` (1024px), and `cq-xl` (1280px). For example, `cq-md-grid-cols="2"` generates a min-width container query around the `grid-template-columns` declaration. A query applies to descendants, never to the container element itself.

These modifiers query the nearest eligible size container and express minimum widths only. They can be combined with viewport and state prefixes, for example `md-cq-md-hover-bg="primary/10"`. A named container is currently not selected in the generated query; the browser uses the nearest eligible ancestor.

## Limits and CSS fallback

AtomAttr does not parse arbitrary container query expressions, named-container selectors, style queries, or scroll-state queries. Use an ordinary CSS rule for those cases. Container query units such as `cqw` and `cqi` may be passed as raw CSS values, subject to browser support.
