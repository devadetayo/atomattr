# HTML
> Use Atomattr directly in HTML by loading the defaults stylesheet and starting the DOM engine once.

## Page setup

HTML is the canonical Atomattr target: every other guide writes the same attributes. The browser engine scans attributes, generates CSS rules for what it finds, and refreshes when the DOM changes.

The example below uses the version-pinned CDN files. If you built the package locally with `npm run build:library`, use `/dist/defaults.css` and `/dist/atomattr.min.js` instead. See the [installation guide](installation.html) for bundler setups.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/atomattr@1.0.1/dist/defaults.css">
  </head>
  <body bg="gray-50" text="gray-950">
    <main p="6">
      <h1 font-size="4xl" font-weight="bold">HTML first</h1>
    </main>
    <script src="https://cdn.jsdelivr.net/npm/atomattr@1.0.1/dist/atomattr.min.js" defer></script>
  </body>
</html>
```

## Component example

A complete component usually combines layout, spacing, colour, typography, radius, border, and state attributes. The tabs show the same markup for every framework.

```html
<article display="flex" flex-col gap="5" p="6" bg="white" dark-bg="gray-900" rounded="2xl" border="border" shadow="md">
  <div display="flex" items="center" justify="between" gap="3">
    <h2 font-size="2xl" font-weight="bold">Pro</h2>
    <span px="3" py="1" rounded="full" bg="primary/10" text="primary">Popular</span>
  </div>
  <p text="muted" line-height="relaxed">A readable card built without class strings.</p>
  <button px="4" py="2.5" rounded="lg" bg="primary" text="white" hover-bg="primary/80">
    Start trial
  </button>
</article>
```

## Responsive, state and dark variants

Prefix any attribute to scope it. `md-` and `lg-` apply from a breakpoint up, `hover-` and `focus-` apply on interaction, and `dark-` applies when `html` has the `dark` class.

```html
<a href="/pricing" display="inline-flex" px="4" py="2" rounded="lg" bg="gray-900" text="white" hover-bg="primary" dark-bg="white" dark-text="gray-950" md-px="6">
  See pricing
</a>
```

## Dynamic HTML

The engine observes DOM changes and scans inserted markup automatically. If you need generated rules immediately after inserting markup, import `refreshAtomAttr` from `atomattr` and call `refreshAtomAttr(container)` on the changed element or its parent.

```js
import { refreshAtomAttr } from 'atomattr';

const list = document.querySelector('#results');
list.insertAdjacentHTML('beforeend', '<li p="3" rounded="lg" bg="gray-100">New row</li>');
refreshAtomAttr(list);
```

## Server-rendered pages

Atomattr works in any template language, such as PHP, Rails, Django or Laravel Blade, because it only needs attributes in the final HTML. Print attribute values from your template as usual, and load the two files once in the layout.

```php
<!-- layout.php -->
<div p="6" bg="<?= $isFeatured ? 'primary/10' : 'gray-50' ?>" rounded="2xl">
  <?= $content ?>
</div>
```
