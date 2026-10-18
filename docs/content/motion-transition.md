# Transitions
> Animate changes between CSS property values when an interaction or state changes.

## Choose properties and duration

Use `transition` to select properties, such as `color`, `transform`, or `all`. Set `transition-duration` or its `duration` alias to control the time. CSS durations use time units such as `150ms` or `0.2s`; do not omit the unit for a duration.

```html
<button bg="primary" hover-bg="primary/80" transition="background-color" duration="150ms" ease="ease-out">
  Save changes
</button>
```

## Timing and delay

Use `transition-timing` or `ease` for the timing function and `transition-delay` or `delay` to wait before a transition begins. Values follow CSS timing functions, including `ease`, `linear`, and `cubic-bezier(...)`.

## Discrete properties and reduced motion

`transition-behavior` controls whether discrete property changes can transition where supported. Many layout and display changes do not interpolate smoothly. Keep transitions brief and honor reduced-motion preferences in your project CSS for motion that could be uncomfortable.

## Attributes

The table lists transition property, timing, duration, delay, and behavior attributes.
