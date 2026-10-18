# Getting started with AtomAttr
> Learn the attribute model, set up the browser engine, and find the right guide for each feature.

## The model

AtomAttr maps registered HTML attributes to generated CSS. Put a property name on the element and its value in the attribute value. The browser engine scans the document, inserts rules for attributes it recognizes, and watches for DOM changes.

```html
<article bg="surface" p="6" rounded="xl" border="border">
  <h2 font-size="xl" font-weight="bold" mb="2">Profile card</h2>
  <p text="muted">The markup carries the styling choices.</p>
</article>
```

To use it in an app, follow the [installation guide](installation.html). The [syntax guide](syntax.html) explains how attributes and modifier prefixes are parsed; [values](values.html) explains tokens and CSS values.

## Find an attribute or feature

The [cheatsheet](cheatsheet.html) lists every registered styling name and its CSS mapping. Use [search](search.html) to find a property by name, CSS output, value, or modifier. Topic references group related attributes, such as [layout](layout-display.html), [spacing](spacing-padding.html), [color](colors-backgrounds.html), and [typography](typography-font.html).

## Choose the right guide

- Use [responsive attributes](responsive.html) for viewport breakpoints and [container queries](container-queries.html) for ancestor size thresholds.
- Use [states](states.html), [dark mode](dark-mode.html), and [pseudo-elements](pseudo-elements.html) for supported selector modifiers.
- Use the [HTML guide](html.html) for browser markup, the [React guide](react.html) for JSX props, and the [React Native guide](react-native.html) for native primitives.
- Use [performance](performance.html) for runtime behavior and current limits.

## Copy and adapt a component

AtomAttr UI provides examples that can be previewed and copied as HTML. Start with a pattern in the [UI library](ui.html), then check its attributes against the reference pages and adapt its semantics, content, and responsive behavior to your app.
