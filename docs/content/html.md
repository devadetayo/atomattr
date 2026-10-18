# HTML
> Use Atomattr directly in HTML by loading the defaults stylesheet and starting the DOM engine once.

## Page setup

HTML is the canonical Atomattr target. The browser engine scans attributes, generates CSS rules for what it finds, and refreshes when the DOM changes.

The example below assumes Atomattr has been built locally in this repository, so the files are available at `/dist`. For a standalone page without a local build, use the version-pinned CDN links in the [installation guide](installation.html).

```html
<!doctype html>
<html lang="en">
  <head>
    <link rel="stylesheet" href="/dist/defaults.css">
  </head>
  <body bg="gray-50" text="gray-950">
    <main p="6">
      <h1 font-size="4xl" font-weight="bold">HTML first</h1>
    </main>
    <script src="/dist/atomattr.min.js" defer></script>
  </body>
</html>
```

## Component example

A complete HTML component usually combines layout, spacing, color, typography, radius, border, and state attributes.

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

## Dynamic HTML

The engine observes DOM changes and scans inserted markup automatically. If you need generated rules immediately after inserting markup, import `refreshAtomAttr` from `atomattr` and call `refreshAtomAttr(container)` on the changed element or its parent.

