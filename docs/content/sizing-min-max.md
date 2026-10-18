# Min and max size
> Set lower and upper size limits to keep layouts usable as content and viewports change.

## Physical dimensions

Use `min-w`, `max-w`, `min-h`, and `max-h` to constrain width and height. A common pattern gives content a maximum width and lets automatic side margins center it. Numeric values use the spacing scale; CSS lengths, percentages, viewport units, and functions can also be used.

```html
<main w="full" max-w="72rem" mx="auto" px="4">
  <h1>Comfortable reading width</h1>
</main>
```

## Logical dimensions

Use `min-inline-size`, `max-inline-size`, `min-block-size`, and `max-block-size` when constraints should follow the writing mode. Inline size roughly corresponds to width in horizontal writing; block size roughly corresponds to height.

## Avoiding overflow

Grid and flex children can have an automatic minimum size based on their content. `min-w="0"` or `min-inline-size="0"` lets a child shrink below that content width so overflow handling can work. Choose `overflow` behavior deliberately if content can exceed the constrained box.

```html
<div display="flex" gap="4">
  <aside basis="14rem">Sidebar</aside>
  <main grow="1" min-w="0" overflow-x="auto">Wide content</main>
</div>
```

## Attributes

The table lists physical and logical min/max size attributes and their CSS outputs.
