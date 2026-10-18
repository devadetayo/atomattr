# Pseudo-elements
> Use `before-` and `after-` attributes for small CSS-generated decorations.

## Before and after

Prefix a registered property with `before-` or `after-` to target `::before` or `::after`. Generated pseudo-elements need a `content` declaration; use `before-content` or `after-content` for it. They are not real DOM nodes and cannot carry meaningful interactive or accessible content.

```html
<span relative pl="4" before-content="' '" before-position="absolute" before-left="0" before-top="2" before-size="2" before-rounded="full" before-bg="primary">
  New feature
</span>
```

## Decorative uses

Pseudo-elements work well for small visual marks, labels, and separators. The positioned example requires a positioned parent. Use `content="''"` for an empty generated box, or a quoted string value when text is purely decorative.

## Limits

AtomAttr supports only its built-in `before` and `after` prefixes, not arbitrary pseudo-element names or selector functions. Put meaningful text in actual markup, and do not rely on generated content as the only label or instruction.
