# Animation and timelines
> Set CSS animation properties and connect animations to scroll or view progress.

## Named animations

Use `animation-name` and the related duration, timing, delay, iteration, direction, fill, and play attributes to configure a CSS animation. The animation name must be defined by a `@keyframes` rule in your stylesheet. AtomAttr does not generate keyframes for names such as `pulse`.

```html
<span animation-name="pulse" animation-duration="1.5s" animation-iteration="infinite">
  Live status
</span>
```

```css
@keyframes pulse {
  50% { opacity: 0.5; }
}
```

## Scroll and view timelines

Timeline attributes such as `animation-timeline`, `scroll-timeline-name`, and `view-timeline-name` map CSS timeline properties. They only connect an animation to a timeline; define any required named timeline and keyframes in CSS. Timeline values and ranges follow the CSS feature syntax and browser support.

## Support and reduced motion

Scroll-driven animation features are not available in every browser/version. Provide a useful static state when the timeline is unsupported. Avoid motion that communicates essential state only and honor the user's reduced-motion preference.

## Attributes

The table lists animation and timeline properties registered by AtomAttr. For simple interaction feedback, see [Transitions](motion-transition.html).
