# Tables and lists
> Style native tables, lists, columns, and related box behavior while preserving their semantics.

## Tables

Use semantic `<table>`, `<caption>`, `<thead>`, `<tbody>`, `<th>`, and `<td>` elements. `table-layout="fixed"` distributes columns according to the table width; `border-collapse="collapse"` merges adjacent table borders, while `border-separate` keeps them distinct. Use `border-spacing` with separated borders.

```html
<table w="full" table-layout="fixed" border-collapse="collapse">
  <caption>Quarterly totals</caption>
  <thead><tr><th scope="col" align="left">Quarter</th><th scope="col" align="right">Total</th></tr></thead>
  <tbody><tr><th scope="row">Q1</th><td align="right">120</td></tr></tbody>
</table>
```

## Lists and columns

Use `list-style`, `list-position`, and `list-style-image` to style markers while keeping ordered or unordered list markup. The `columns`, `col-count`, `col-width`, and `col-gap` attributes control CSS multi-column flow; content flows between columns and may not follow a simple row-by-row reading order.

## Box and blending properties

`box-sizing`, `float`, `clear`, `isolation`, `mix-blend`, and `bg-blend` map to their CSS properties. These can affect layout and stacking behavior; use them where their CSS semantics are clear and test text contrast when blending content.

## Attributes

The table lists the registered table, list, column, box, float, and blending attributes covered here.
