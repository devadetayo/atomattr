# Container queries
> Style a component from the width of its own container. Atomattr 1.0.1 has no `cq-` prefix, so the query itself is written in CSS.

## Declare the container

Mark the ancestor as a size container with an inline `style`, or in your stylesheet. Give it a name if you want the query to target it specifically.

```html
<section class="card-shell" style="container: card / inline-size" p="4" border="1" border-color="border" rounded="xl">
  <article class="card" display="grid" grid-cols="1" gap="4">
    <img src="cover.jpg" alt="" aspect="video" object="cover" rounded="lg">
    <div><h2 font-size="xl" font-weight="bold">A component that follows its parent width</h2></div>
  </article>
</section>
```

## Write the query in CSS

Attributes cannot change inside a container query in 1.0.1, so the responsive rule goes in a stylesheet. Target the element with a class or an attribute selector, and keep the default layout in attributes.

```css
@container card (min-width: 32rem) {
  .card { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
```

## Viewport breakpoints instead

When the layout only needs to follow the viewport, prefer the built-in prefixes: `sm-`, `md-`, `lg-`, `xl-` and `2xl-`. See [Responsive attributes](responsive.html).

```html
<article display="grid" grid-cols="1" md-grid-cols="2" gap="4">
  <img src="cover.jpg" alt="" aspect="video" object="cover">
  <h2 font-size="xl" font-weight="bold">Responds to the viewport</h2>
</article>
```
