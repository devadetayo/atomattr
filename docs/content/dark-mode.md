# Dark mode
> Scope dark-prefixed attributes under the root `html.dark` class.

## Add dark variants

Use a base value for the default theme and a `dark-` prefix when a property needs a different dark-theme value. AtomAttr generates the prefixed selector under `html.dark`.

```html
<article bg="white" text="gray-950" dark-bg="gray-900" dark-text="white" border="border" dark-border-color="gray-700">
  Theme-aware content
</article>
```

## Switch the theme

The prefix does not detect system preference or create a toggle by itself. Add or remove the `dark` class on the root `<html>` element in your application. Setting `data-theme="dark"` is also useful to your own theme code, but the generated selector specifically depends on the `dark` class.

```js
document.documentElement.classList.toggle('dark', prefersDark);
```

The AtomAttr theme API can set the same class and regenerate theme-dependent rules. Keep the class change and your semantic CSS variables in sync if the app maintains its own theme system.

## Color strategy

Use semantic tokens such as `surface`, `text`, and `muted` where their definitions suit both themes. Add explicit `dark-` values when a component needs a particular contrast or surface treatment, and check text, borders, focus indicators, and disabled states in both modes.
