# Filters
> Apply CSS filter functions to an element and its rendered content.

## Filter attributes

Use `blur`, `brightness`, `contrast`, `grayscale`, `hue-rotate`, `invert`, `saturate`, or `sepia`. AtomAttr combines these components into the CSS `filter` property. Numeric blur values are pixels; numeric hue rotation values are degrees; numeric percentage-like filter values are interpreted as percentages.

```html
<img src="photo.jpg" alt="Landscape" grayscale="100" hover-grayscale="0" transition="filter" duration="200ms">
```

## Combine filter components

Different filter attributes on one element compose through AtomAttr's generated filter template. Existing custom `filter` declarations on the same element may compete with that generated declaration in the CSS cascade; use the component attributes together when you want AtomAttr to compose them.

## Performance and accessibility

Large blur regions and animated filters can be expensive to render, especially on mobile hardware. Test them on target devices. Avoid relying on a color filter alone to communicate information.

## Attributes

The table lists the supported filter component attributes. For effects behind an element, see [Backdrop filters](effects-backdrop.html).
