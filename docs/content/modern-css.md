# Modern CSS capabilities
> Use registered AtomAttr attributes to emit modern CSS declarations supported by the browser.

## Container queries

Set `container="card / inline-size"` on an ancestor, then use a `cq-*` modifier on a descendant. The current modifiers cover fixed minimum widths and target the nearest eligible size container; they do not expose arbitrary query syntax or named-container selection. See [Container queries](container-queries.html) for details.

```html
<article container="card / inline-size" p="4" border="border">
  <div display="grid" grid-cols="1" cq-md-grid-cols="2" gap="4">
    <img object="cover" aspect="video" src="cover.jpg" alt="">
    <div><h2 text-wrap="balance">A card that responds to its own width</h2></div>
  </div>
</article>
```

## Modern property coverage

The dictionary includes properties for logical sizing and insets, text wrapping and clamping, containment, field sizing, scroll and view timelines, anchor positioning, masks and clipping, and View Transitions. AtomAttr emits declarations; it does not polyfill features or make unsupported browser CSS work.

## Browser support

Feature support varies by browser and version. Check your support targets for anchor positioning, scroll-driven animation timelines, `field-sizing`, intrinsic-size interpolation, and other newer CSS features. Provide a fallback for any feature required to use the interface.

## Focused guides

- [Container queries](container-queries.html): set up a query container and use supported size modifiers.
- [Anchor positioning](anchor-positioning.html): connect positioned elements to CSS anchors.
- [Scroll-driven animations](scroll-driven-animations.html): use CSS scroll and view timelines.
- [View Transitions](view-transitions.html): name elements participating in transition snapshots.
- [Selectors and states](selectors.html): review the selector variants supported by the parser.
- [Runtime and performance](performance.html): understand rule generation and mutation handling.
