# Modern CSS
> Atomattr 1.0.1 covers the everyday CSS properties. For newer platform features, write that part in CSS and keep using attributes for everything else.

## What the attribute engine covers

The engine maps about 320 attribute names to CSS properties: layout, spacing, sizing, colour, borders, typography, filters, transforms, transitions, animations and scroll snapping. Browse the full list in the [cheatsheet](cheatsheet.html). Values can be tokens, or raw CSS such as `calc()`, `clamp()`, `var()`, gradients and `url()`, which pass straight through.

```html
<section p="clamp(1rem, 4vw, 3rem)" min-h="calc(100dvh - 4rem)" bg="linear-gradient(135deg, #0f172a, #2563eb)" text="white">
  Raw CSS values work on any registered attribute.
</section>
```

## Features that need plain CSS

The published 1.0.1 package does not register attributes for container queries, anchor positioning, scroll-driven animations, View Transitions, `text-wrap`, line clamping, logical properties such as `padding-inline`, or the `cq-` prefix. Write those in a stylesheet or an inline `style` attribute, and style the rest of the element with attributes.

```html
<article style="container-type: inline-size" p="4" border="1" border-color="border" rounded="xl">
  <h2 style="text-wrap: balance" font-size="xl" font-weight="bold">Mixed approach</h2>
  <p text="muted">Platform feature in CSS, everything else in attributes.</p>
</article>
```

The focused guides show the CSS for each feature: [Container queries](container-queries.html), [Anchor positioning](anchor-positioning.html), [Scroll-driven animations](scroll-driven-animations.html) and [View Transitions](view-transitions.html).

## Browser support

Check your support targets before using newer CSS. Anchor positioning, scroll-driven timelines and View Transitions are still rolling out across browsers, so give interactive UI a fallback that works without them. Atomattr only generates declarations; it does not polyfill anything.

## Related guides

- [Selectors and states](selectors.html): the supported state and structural prefixes.
- [Runtime and performance](performance.html): how rules are generated and cached.
