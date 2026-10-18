# Text alignment
> Align inline text and control the vertical alignment of inline-level content.

## Text alignment

Use `align` or `text-align` to align inline content inside a block. Common values include `start`, `center`, `end`, `left`, `right`, and `justify`. `start` and `end` follow the text direction; physical left and right do not.

```html
<article max-w="40rem">
  <h2 align="center">Centered heading</h2>
  <p align="start">Body text follows the start edge of the writing direction.</p>
</article>
```

## Responsive text alignment

Text alignment can change at a viewport breakpoint when the content layout changes. Ensure alignment choices do not make related content harder to scan, especially for long paragraphs.

## Vertical alignment

Use `vertical-align` on inline, inline-block, or table-cell content to align it relative to a line box or cell. It does not vertically center arbitrary block elements; use flexbox or grid alignment for that layout task.

## Attributes

The table lists text alignment and vertical alignment attributes and their CSS outputs.
