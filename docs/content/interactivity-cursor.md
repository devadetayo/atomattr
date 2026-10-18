# Cursor, pointer, and touch
> Control pointer behavior, selection, resizing, and browser-native appearance.

## Cursor and pointer events

Use `cursor` to choose the pointer cursor, for example `pointer` on an action that behaves like a button. Use `pointer-events="none"` when an overlay should not receive pointer input; its descendants may need an explicit pointer-events value if they should remain interactive.

```html
<button cursor="pointer">Open details</button>
<span pointer-events="none" aria-hidden="true">Decorative overlay</span>
```

## Selection, touch, and resizing

`user-select` or its `select` alias controls text selection. `touch` maps to `touch-action`, which can constrain browser gesture handling; use it carefully so scrolling and zoom remain usable. `resize` controls whether a resizable element, commonly a textarea, can be resized.

## Appearance and will-change

`appearance` controls native widget styling and may reduce built-in platform affordances. Preserve clear focus, selected, and disabled states when changing it. `will-change` hints that a property may change; use it sparingly and remove it when the effect ends because it can increase resource usage.

## Attributes

The table lists cursor, pointer events, selection, resize, appearance, touch-action, and will-change attributes. Prefer semantic buttons and links over cursor styling alone to convey interactivity.
