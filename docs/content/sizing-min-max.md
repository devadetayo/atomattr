# Min and max size
> Set lower and upper size limits to keep layouts usable as content and viewports change.

## Physical dimensions

Use `min-w`, `max-w`, `min-h`, and `max-h` to constrain width and height. A common pattern gives content a maximum width and lets automatic side margins center it. Numeric values use the spacing scale; CSS lengths, percentages, viewport units, and functions can also be used.

```html
<main w="full" max-w="72rem" mx="auto" px="4">
  <h1>Comfortable reading width</h1>
</main>
```

## Avoiding overflow

Grid and flex children can have an automatic minimum size based on their content. `min-w="0"` lets a child shrink below that content width so overflow handling can work. Choose `overflow` behavior deliberately if content can exceed the constrained box.

```html
<div display="flex" gap="4">
  <aside basis="14rem">Sidebar</aside>
  <main grow="1" min-w="0" overflow-x="auto">Wide content</main>
</div>
```

## Attributes

The table lists min and max size attributes and their CSS outputs.
