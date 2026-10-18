# Positioning
> Choose the positioning scheme that determines how an element is placed in the document.

## Position modes

Use `position="relative"` to keep an element in normal flow while establishing a containing block for absolutely positioned descendants. `absolute` removes an element from normal flow and positions it against its containing block. `fixed` positions relative to the viewport in the usual case; `sticky` remains in flow until it reaches an inset threshold within its scroll container.

```html
<article position="relative" p="5" border="border" rounded="xl">
  <span position="absolute" top="3" right="3" bg="primary" text="white" rounded="full" px="2">New</span>
  <h2>Card content</h2>
</article>
```

## Sticky headers

A sticky element needs an inset such as `top="0"` to define when it sticks. It is constrained by the relevant scrolling ancestor and can be covered by other stacking contexts. Add a suitable background and `z` value when it should remain visible above page content.

## Offsets and stacking

Use `top`, `right`, `bottom`, `left`, logical inset attributes, and `z` to set offsets and stack order. These values do not change an element's position mode: offsets generally require a positioned element, and stacking order can be affected by stacking contexts.

## Attributes

The table lists position modes. See [Inset and z-index](inset-z-index.html) for offset attributes and stacking order.
