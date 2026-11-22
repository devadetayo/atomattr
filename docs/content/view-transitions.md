# View Transitions
> Animate between page states with the browser View Transitions API. Atomattr 1.0.1 has no attribute for `view-transition-name`, so set it inline or in CSS.

## Name the element

Give the element a `view-transition-name` with an inline `style`, then start the transition from script. Use Atomattr attributes for everything else on the element.

```html
<article style="view-transition-name: product-card" p="4" rounded="xl" bg="surface" border="1" border-color="border">
  Product card
</article>
```

```js
if (document.startViewTransition) {
  document.startViewTransition(() => updateTheDom());
} else {
  updateTheDom();
}
```

## Notes

Each name must be unique on the page while a transition runs. Attributes you change inside the callback are picked up by the engine as usual, because it observes attribute changes. Browsers without the API run the callback directly, so the interface still works.
