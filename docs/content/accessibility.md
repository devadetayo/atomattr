# Accessibility
> Use AtomAttr styles alongside semantic HTML, keyboard interaction, and readable contrast.

## Semantic markup first

AtomAttr controls presentation. It does not add accessible names, roles, keyboard behavior, or form semantics. Use native buttons, links, labels, headings, and input types, and provide useful alternative text for meaningful images.

## Focus and interaction states

Keep keyboard focus visible with `focus-visible-` styles, and preserve clear hover, active, disabled, checked, and invalid states. Do not remove the browser outline unless a replacement indicator is present and tested against every theme and surface.

```html
<button focus-visible-outline="2px solid" focus-visible-outline-color="primary" focus-visible-outline-offset="2px">
  Continue
</button>
```

## Visually hidden text

The `sr-only` helper clips content visually while keeping it in the accessibility tree; `not-sr-only` restores it. Use this for supporting labels or context when visible text is not suitable, but provide a visible label whenever the interface needs one.

## Contrast and motion

Check text, controls, borders, focus indicators, and status colors in all themes. Do not convey meaning through color alone. Keep animation and smooth transitions restrained, and honor reduced-motion preferences in application CSS.

## Attributes

The table lists accessibility-related helpers in the dictionary. The behavior of assistive technologies and browser accessibility APIs depends on the semantic markup as well as presentation.
