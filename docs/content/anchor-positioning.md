# Anchor positioning
> Tie a popover to its trigger with CSS anchor positioning. Atomattr 1.0.1 has no anchor attributes, so use CSS for the anchor and attributes for the look.

## Connect an anchor and a positioned element

Name the anchor and position the floating element against it in CSS. The attributes handle spacing, colour and shape.

```html
<style>
  .help-btn { anchor-name: --help-anchor; }
  .help-tip { position-anchor: --help-anchor; position-area: block-end; }
</style>

<button class="help-btn" aria-describedby="help-tip" px="3" py="2" rounded="lg" bg="primary" text="white">Help</button>
<div id="help-tip" class="help-tip" role="tooltip" position="fixed" p="3" rounded="lg" bg="gray-950" text="white">
  Contextual help tied to its trigger
</div>
```

`position="fixed"` is an Atomattr attribute; the two anchor lines are CSS. This shows positioning only. A real tooltip or popover also needs visibility, keyboard dismissal and focus handling.

## Fallback for older browsers

Anchor positioning is not in every browser yet. Without it the element simply uses its normal `position`, so choose a sensible default, such as `position="absolute"` with `top` and `left` attributes, and let the CSS override it where supported.

```html
<div role="tooltip" position="absolute" top="full" left="0" mt="2" p="3" rounded="lg" bg="gray-950" text="white">
  Positioned below its parent by default
</div>
```
