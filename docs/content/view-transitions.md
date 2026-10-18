# View Transitions
> Style named snapshots for browser View Transitions without adding routing or transition orchestration to AtomAttr.

## Name participating elements

Set `view-transition-name` on elements that should receive their own snapshot. Names must be unique among simultaneously rendered participants. AtomAttr provides the CSS property and leaves transition initiation to the browser navigation or application code. Import the browser engine and defaults stylesheet first; see the [installation guide](installation.html).

```html
<article view-transition-name="product-card" bg="white" dark-bg="gray-900" rounded="xl" p="5">
  <h2>Product details</h2>
</article>
```

## Style transition snapshots

View Transition snapshots use special pseudo-elements such as `::view-transition-old()` and `::view-transition-new()`. The current AtomAttr attribute parser targets attributes on elements and supports only its built-in `before` and `after` pseudo-element prefixes; use a stylesheet for transition pseudo-element selectors and the `@view-transition` at-rule.

## Progressive enhancement

Treat these styles as progressive enhancement. Keep navigation and content updates functional without transitions, and respect reduced-motion preferences in the CSS that starts or styles a transition.

