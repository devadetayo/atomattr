# Anchor positioning
> Use registered CSS anchor-positioning properties to place floating UI relative to an anchor.

## Connect an anchor and positioned element

Give the anchor element an `anchor-name`, then set `position-anchor` on the positioned element and choose a `position-area`. CSS custom identifiers use a leading `--` for names such as `--help-anchor`. AtomAttr emits these CSS declarations; the browser implements the positioning behavior.

```html
<button anchor-name="--help-anchor" aria-describedby="help-tip">Help</button>
<div id="help-tip" position="fixed" position-anchor="--help-anchor" position-area="block-end" p="3" rounded="lg" bg="gray-950" text="white">
  Contextual help tied to its trigger
</div>
```

This example shows positioning only. It does not implement tooltip visibility, keyboard dismissal, focus management, or ARIA behavior; a real tooltip or popover needs appropriate semantics and interaction.

## Anchor functions

CSS values may include `anchor()` and `anchor-size()`, for example `top="anchor(bottom)"` or `width="anchor-size(width)"`. AtomAttr passes these values through to CSS. They require a valid anchor context and browser support.

## Fallbacks and limits

The dictionary exposes properties including `anchor-name`, `anchor-scope`, `position-anchor`, `position-area`, and `position-try-fallbacks`. AtomAttr does not create `@position-try` rules or move elements with JavaScript. Provide a usable fallback layout for browsers that do not support anchor positioning and verify the feature in your browser support targets.
