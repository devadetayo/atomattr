# AtomAttr UI library

The published catalog is defined in [`data/catalog-data.js`](data/catalog-data.js).
Each record has a stable `id` and `slug`, descriptive metadata, and authored AtomAttr
HTML in `preview`. That exact markup is rendered in the card and detail preview and
is the HTML source shown for copying. The detail page can wrap it in a React component
using the project's `atomattr` integration.

Only implemented patterns belong in the catalog. Components are individual controls
or interface pieces; sections are larger reusable page blocks. `Templates` remains an
empty category until a complete page and its accurate source are ready. There is no
purchase or download flow in this project, so no premium or locked listings are shown.

To add a published item, add a unique ID and slug, a concise description, relevant
search tags, and complete preview markup. Keep the preview self-contained, accessible,
and valid under `src/engine/parser.js`. Avoid external assets unless the source also
documents and loads them correctly. HTML is canonical; React output is generated from
the same markup, with void HTML elements normalized for JSX.
