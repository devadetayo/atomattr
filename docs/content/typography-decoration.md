# Decoration and case
> Add, style, remove, or transform text decoration and font style.

## Text decoration

Use the bare `underline` and `line-through` helpers for common decorations, or use `decoration` / `text-decoration` with a CSS text-decoration-line value such as `underline` or `line-through`. `no-underline` removes text decoration. Decoration color, style, and thickness can be controlled independently with `decoration-color`, `decoration-style`, and `decoration-thickness`.

```html
<a href="/terms" underline decoration-color="primary" decoration-style="dotted">
  Read the terms
</a>
```

## Text case

Use `text-transform` or its helpers such as `uppercase`, `lowercase`, `capitalize`, and `normal-case`. These change visual casing only; the underlying text and assistive technology output remain unchanged. Write labels in their intended semantic form where possible.

## Italic style

Use the bare `italic` or `not-italic` helpers, or set `font-style` directly. Italic appearance depends on the loaded font face and may be synthesized by the browser.

## Attributes

The table lists decoration, case, and italic-related attributes. Preserve visible focus styles and sufficient contrast for interactive links.
