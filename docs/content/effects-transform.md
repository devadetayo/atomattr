# Transforms
> Translate, rotate, scale, or skew an element with CSS transform properties.

## Transform functions

Use `translate-x`, `translate-y`, `translate-z`, `rotate`, `scale`, `scale-x`, `scale-y`, `skew-x`, and `skew-y` to build an element's transform. AtomAttr stores these as custom properties and combines them into one transform declaration. Numeric translations use the spacing scale; bare rotation values are degrees; scale values are multipliers or percentages accepted by CSS transforms.

```html
<button hover-translate-y="-1" hover-scale="1.02" transition="transform" duration="150ms">
  Lift on hover
</button>
```

## Origin and 3D context

Use `transform-origin` to choose the point around which the transform occurs. `transform-style`, `backface-visibility` (attribute `backface`), and `perspective` affect 3D rendering contexts. Their effect depends on the surrounding transform hierarchy.

## Layout effects

Transforms change visual rendering without changing the element's normal-flow space. Large translations can overlap nearby content, and transforms can establish containing blocks or stacking contexts. Use layout properties for structural changes and transforms for visual motion.

## Attributes

The table lists transform and transform-component attributes and their CSS outputs. The separate transform helpers compose through AtomAttr custom properties.
