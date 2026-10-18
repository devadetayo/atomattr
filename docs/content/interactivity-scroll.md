# Scroll behavior
> Set scrolling behavior and snap alignment for scroll containers and their children.

## Smooth scrolling

Use `scroll-behavior="smooth"` on the scrolling element for smooth programmatic or anchor navigation. Respect reduced-motion preferences; smooth movement can be uncomfortable for some users. The browser controls native user scrolling regardless of this property.

## Scroll snapping

Set `scroll-snap="x mandatory"` or another valid CSS `scroll-snap-type` value on a scroll container, then set `scroll-snap-align` on its children. The container also needs a scrolling overflow context and enough content to scroll.

```html
<div display="flex" overflow-x="auto" scroll-snap="x mandatory" gap="4">
  <article min-w="80%" scroll-snap-align="start">First panel</article>
  <article min-w="80%" scroll-snap-align="start">Second panel</article>
</div>
```

## Browser behavior

Snap behavior varies with input method and browser. Avoid trapping users at mandatory snap positions when content is difficult to reach. Test keyboard, touch, and pointer scrolling and provide visible controls or indicators where the interaction is not obvious.

## Attributes

The table lists scroll behavior, snap type, and snap alignment attributes. Overflow properties are documented on the [Overflow](overflow.html) page.
