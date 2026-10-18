# Opacity
> Set an element's transparency from fully transparent to fully opaque.

## Opacity values

Use `opacity` with a number from `0` to `100`; AtomAttr converts the value to the CSS fraction, so `opacity="50"` becomes `0.5`. Raw CSS values such as `0.75` also work. Opacity applies to the entire element and its rendered descendants, including text and controls.

```html
<div opacity="80">Slightly translucent content</div>
<button disabled opacity="50">Disabled by HTML and visually dimmed</button>
```

## Prefer color alpha for a surface only

If only the background should be translucent while the text remains fully opaque, use an alpha color such as `bg="primary/80"` instead of setting opacity on the entire element.

## States and transitions

`hover-opacity` or `disabled-opacity` can vary opacity by state. Add an appropriate transition property and duration for a smooth change. Do not use opacity alone to communicate disabled status; use the native `disabled` state or another semantic cue as well.

## Attribute

The table lists the opacity attribute and its CSS output.
