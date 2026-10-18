# Scroll-driven animations
> Use CSS animation timeline properties to link an animation to scroll progress or an element passing through a scrollport.

## Timeline properties

AtomAttr provides declaration attributes for `scroll-timeline`, `view-timeline`, `animation-timeline`, and animation range properties. CSS animation keyframes must be defined in a stylesheet; AtomAttr does not create `@keyframes` blocks. Load the browser engine and defaults stylesheet first, as shown in the [installation guide](installation.html). A named scroll timeline is defined with `scroll-timeline-name` and `scroll-timeline-axis`; an animation can refer to it with `animation-timeline`.

```html
<div scroll-timeline-name="page-progress" scroll-timeline-axis="block" overflow-y="auto">
  <div animation-name="grow" animation-duration="1s" animation-timing="linear" animation-fill="both" animation-timeline="scroll(page-progress)" animation-range="0% 100%">Progress indicator</div>
</div>
```

```css
@keyframes grow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
```

## Motion preferences and support

Scroll-linked effects can cause discomfort or hide content. Keep the underlying content visible and add a reduced-motion fallback in your stylesheet, such as a `prefers-reduced-motion` media rule. Support for timeline features varies by browser; check your target browser matrix.
