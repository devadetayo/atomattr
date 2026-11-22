# AtomAttr Studio

React and TypeScript canvas editor for visual website and app UI design. The project document is the source of truth for the canvas, layers, code view, and export. Editor styling uses AtomAttr attributes; the only inline style is the canvas zoom transform.

## Run

From this folder, install dependencies with `npm install`, then run `npm run dev`. Create a production build with `npm run build`. The build copies the AtomAttr runtime and default stylesheet into `dist/atomattr-runtime` for offline export support.

## Current phase status

Phases 1–7 have implementation work in the Studio: auto layout; tokens and linked text styles; components and UI kit; attribute/state editing; HTML/React code round trip; links, compare artboards, and a mobile device frame; and native form controls with CSV-backed static repeaters. These phases have not received the user's combined browser verification pass yet. The editor also includes local project save/open and static-site ZIP export.

Phase 8 is in progress. The Studio now has static accessibility/content checks plus rendered breakpoint checks for overflow, small mobile text, and touch targets; device viewport presets and custom dimensions; syntax-colored read-only code; SVG primitive import; image replacement, fit, drag-to-adjust crop, and CSS filters; CSS gradient fills; a drag-to-draw arrow tool; named project snapshots; and a runnable React/Vite ZIP export. The React ZIP was generated, inspected as a valid archive, installed in a fresh temporary directory, and production-built successfully.

Auto layout inference uses recursive whitespace cuts over stored design rectangles. It can infer simple row/column groupings and approximate gap values. It does not measure DOM rects, reliably infer cross-axis alignment/padding, or handle overlapping/irregular compositions. Review inferred results before relying on them.

Compare mode shows full-size artboards in a horizontally scrollable gallery; selecting one returns to the main canvas at that breakpoint. Link preview supports `page:<id>`, `#anchor`, and URL navigation. Repeaters expand the first child once per CSV row in the canvas and exports; React output is statically expanded. Image focal position is edited as a CSS `object-position` value; the Studio does not yet provide a drag crop window or image overlay editor. Gradient fills are CSS values rather than a visual stop editor. Quality checks cover the active page and are heuristic; they are not a substitute for browser accessibility testing.

## Verification

- `npm run build` succeeds.
- `./node_modules/.bin/tsc --noEmit --pretty false` reports no errors in `atomattr-studio/src` or `stub`. It still reports errors in the parent repository's `react/` leading="normal" because that adapter's imports/declarations are unresolved by the Studio's TypeScript project.
- The Studio build uses the real local AtomAttr React adapter and default stylesheet aliases. The generated React ZIP was validated against the published `atomattr` package in a clean install/build. A combined interactive browser pass for editing, selection, pages, and the dockers remains outstanding.

## AtomAttr integration

The React ZIP imports `atomattr/react` and `atomattr/defaults.css`, which are the package's declared exports. The Studio uses the local `react/index.ts` adapter for canvas and React markup; the exported package dictionary contains the layout, responsive, image, and typography attributes emitted by `src/document/attrs.ts`. CSS-only site export is generated separately by `src/exporters/css.ts`.

## Known limits

- Exported ZIP site is static; hosting/publishing is not included.
- Native, Svelte, Vue, and Angular targets are generated markup, not compiled projects.
- Browser interaction coverage for pen editing, complex transforms, docking, and undo behavior is incomplete. There is not yet a canvas component-placement tool; reusable components are inserted from the Components docker.
- The code panel can be resized, opened, and closed, but does not yet have a separate pin/floating mode.
- Project storage uses browser localStorage and is subject to browser quota.
