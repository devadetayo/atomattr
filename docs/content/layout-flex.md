# Flexbox
> Arrange items in one dimension and control how they wrap, align, and grow.

## Create a flex container

Set `display="flex"` to make children flex items. Direction helpers such as `flex-row` and `flex-col` select the direction; `flex="1"` or `grow="1"` can let an item use available space. The attributes map to distinct CSS properties, so use `display` to create the formatting context and the flex attributes to configure it.

```html
<div display="flex" flex-col md-flex-row items="center" gap="4">
  <img src="avatar.jpg" alt="" size="12" rounded="full">
  <div grow="1"><h2>Profile</h2><p>Supporting details</p></div>
  <button>Follow</button>
</div>
```

## Direction, wrapping, and spacing

Use `flex-row` or `flex-col` for direction. Add `wrap` or `wrap-reverse` when items should move onto additional lines; `no-wrap` keeps them on one line. Use `gap`, `gap-x`, and `gap-y` to space items without adding margins to each child.

## Sizing and order

Use `grow`, `shrink`, `basis`, and `order` on flex items. Their values follow CSS: for example `grow="1"`, `shrink="0"`, `basis="12rem"`, and `order="2"`. Child sizing can change at a breakpoint when the layout changes.

```html
<div display="flex" gap="3">
  <aside basis="14rem" shrink="0">Sidebar</aside>
  <main grow="1" min-w="0">Main content</main>
</div>
```

## Attributes

The table lists registered flex and direction attributes. Pair them with [alignment](layout-alignment.html) and [gap](layout-gap.html) where needed.
