# Text wrapping and overflow
> Control line wrapping, truncation, columns, and list markers.

## Wrapping and breaking

Use `white-space` / `whitespace` to control spaces and wrapping. For balanced headings, add `text-wrap: balance` with an inline `style`, since there is no `text-wrap` attribute in 1.0.1. `word-break`, `overflow-wrap`, and `hyphens` affect how long words break. These attributes map to separate CSS properties, so choose the one that describes the desired behavior.

```html
<h2 max-w="36rem" style="text-wrap: balance">A heading whose lines should have a more even measure</h2>
<p overflow-wrap="anywhere">Averylongidentifierthatoverflowscanbreakwhenneeded.</p>
```

## Truncation

`text-overflow="ellipsis"` needs a constrained inline size and clipping/nowrap behavior to display an ellipsis. The `truncate` helper combines the common single-line truncation declarations. For multi-line clamping, use CSS: `display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden`.

```html
<p w="full" truncate>Long single-line text may end in an ellipsis.</p>
<p style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical" overflow="hidden">Longer content can be visually clamped after several lines.</p>
```

Clamping hides visual content. Do not truncate essential information without another way to access the full text.

## Columns and lists

`columns`, `col-count`, `col-width`, and `col-gap` control multicolumn text layout. `list-style` and `list-position` configure list markers and placement. Use semantic `<ol>` and `<ul>` elements for lists, and check the reading order when content flows across columns.

## Attributes

The table lists registered wrapping, overflow, column, and list presentation attributes.
