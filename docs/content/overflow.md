# Overflow
> Decide how content outside an element's box is clipped, shown, or made scrollable.

## Overflow behavior

Use `overflow`, `overflow-x`, and `overflow-y` to control content along each axis. Common CSS values include `visible`, `hidden`, `clip`, `scroll`, and `auto`. `auto` creates a scrollbar only when content needs it; `hidden` clips content and still permits programmatic scrolling, while `clip` does not create a scroll container.

```html
<div max-h="80" overflow-y="auto" p="4" border="border">
  Long content scrolls within this panel.
</div>
```

## Overscroll behavior

`overscroll`, `overscroll-x`, and `overscroll-y` map to CSS overscroll behavior. Values such as `contain` can prevent scroll chaining from a nested panel to the page at a scroll boundary. Browser and input behavior still apply.

## Truncation and scrolling

Overflow clipping alone does not add an ellipsis or prevent text wrapping. Use the typography attributes such as `text-overflow`, `whitespace`, or `line-clamp` for text presentation. For a scrollable horizontal row, set a constrained width and `overflow-x="auto"`.

## Attributes

The table lists overflow and overscroll attributes. Make sure users can reach clipped content and that focusable controls are not hidden outside the scroll area.
