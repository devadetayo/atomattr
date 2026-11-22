# Scroll-driven animations
> Link an animation to scroll position. Atomattr 1.0.1 registers the `animate` attributes, but not scroll timelines, so the timeline is written in CSS.

## A scroll progress bar

Define the keyframes and timeline in CSS, then use attributes for size, colour and position.

```html
<style>
  @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  .progress { transform-origin: left; animation: grow linear both; animation-timeline: scroll(root); }
</style>

<div class="progress" position="fixed" top="0" left="0" w="full" h="1" bg="primary" z="50"></div>
```

## Respect reduced motion

Scroll-linked motion can be uncomfortable for some people. Wrap the effect so it only applies when motion is acceptable.

```css
@media (prefers-reduced-motion: reduce) {
  .progress { animation: none; transform: none; }
}
```

## Time-based animation with attributes

For animation that runs on its own clock, use the registered attributes: `animate`, `animation-duration`, `animation-delay`, `animation-iteration` and friends. Keyframes are still defined in CSS.

```html
<span display="inline-block" animate="pulse 2s ease-in-out infinite">Live</span>
```
