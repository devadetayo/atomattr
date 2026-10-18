# Text wrapping and overflow
> Control line wrapping, truncation, line clamping, columns, and list markers.

## Wrapping and breaking

Use `text-wrap` for values such as `balance`, `pretty`, or `wrap`, and use `white-space` / `whitespace` to control spaces and wrapping. `word-break`, `overflow-wrap`, and `hyphens` affect how long words break. These attributes map to separate CSS properties, so choose the one that describes the desired behavior.

```html
<h2 max-w="36rem" text-wrap="balance">A heading whose lines should have a more even measure</h2>
<p overflow-wrap="anywhere">Averylongidentifierthatoverflowscanbreakwhenneeded.</p>
```

## Truncation and line clamping

`text-overflow="ellipsis"` needs a constrained inline size and clipping/nowrap behavior to display an ellipsis. The `truncate` helper combines the common single-line truncation declarations. Use `line-clamp` or `line-clamp-lines` for multi-line clamping where supported by the target browser.

```html
<p w="full" truncate>Long single-line text may end in an ellipsis.</p>
<p line-clamp="3">Longer content can be visually clamped after several lines.</p>
```

Clamping hides visual content. Do not truncate essential information without another way to access the full text.

## Columns and lists

`columns`, `col-count`, `col-width`, and `col-gap` control multicolumn text layout. `list-style`, `list-position`, and `list-style-image` configure list markers and placement. Use semantic `<ol>` and `<ul>` elements for lists, and check the reading order when content flows across columns.

## Attributes

The table lists registered wrapping, overflow, column, and list presentation attributes.
