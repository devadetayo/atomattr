# AtomAttr Studio source changes

## Features: image optimization, CMS v1, custom code, performance analysis
- **Image optimization.** Uploads are scaled to 2400 px on the long edge and re-encoded (WebP, JPEG/PNG fallback; SVG and GIF untouched; originals kept when there is no real saving). Assets panel: "Optimize all" re-encodes existing images. Checked in Chromium.
- **CMS v1.** CMS panel: collections, typed fields, items (draft/published, reorder, duplicate), CSV import / append, CSV and JSON export. Repeaters can use a collection as their data source with filter, sort and limit. `{{field}}` bindings are checked by the Checks panel. Dynamic page templates are not included yet.
- **Custom code.** Custom code panel (site-wide or per page): CSS, JavaScript, head HTML. "Custom HTML embed" block for widgets. Included in HTML ZIP, single-file HTML and React exports. Studio previews never run custom JS or head HTML and show embeds in a sandboxed frame.
- **Performance analysis.** Checks panel scores the active page from the real export (HTML, CSS, scripts, images), with load-time estimates and rules for large images, formats, DOM size, requests, blocking scripts and third-party resources.
- **Bug fix:** `{{field}}` bindings used to leave a stray `}` in the output (the regex matched only one closing brace).

## UI polish
- **Three-dots tab menu** no longer clips at the panel edge: it opens in a portal, stays inside the window, closes on outside click / Esc / scroll, and supports arrow keys.
- **Glass toast and dialogs.** New `T.dialog`, `T.toast`, `T.toastError` tokens (theme.ts). Toast has an icon, dismiss button and countdown; errors are tinted glass.
- **Motion.** Dialogs, toasts and menus now fade out instead of vanishing (`studio-pop-out`, `studio-fade-out`, `studio-menu-in` in styles.css).
- **Cleaner cards.** New `T.tile` / `T.tileOn` tokens. New project and Recent cards show a title and a meta line, a check badge when picked and a small hover lift. What's new cards stack title over text instead of running them together.

## Audit follow-up: partial features completed
- **Checks now cover the whole project.** `projectQuality()` runs the static checks on every page (click an issue on another page to jump there) plus new project-wide SEO checks. New rules: empty / `javascript:` / `http://` / scheme-less links, `#anchor` links with no matching element id (node id or `id` attribute), generic link text ("click here"), inputs with no label/placeholder/aria-label or no name, forms with no submit button or no `action`, embedded images over 500 KB, SEO title and description missing / length / duplicate, missing social image, missing site URL. External URL reachability is still not tested (browsers block it via CORS).
- **Version history.** `state/snapshots.ts` adds automatic restore points (about every 10 minutes while editing, newest 10 kept; named snapshots are never dropped). Automatic snapshots leave out image data and restoring merges the current images back, so history does not multiply large assets. The Styles panel marks automatic ones.
- **Backup / recovery.** Saving a 21st project used to delete the oldest from IndexedDB. Projects now stay until deleted; only the in-memory cache and a 200-entry recents list are trimmed.
- **Autosave.** Pending edits are flushed on `pagehide` and when the tab becomes hidden (previously up to 800 ms of edits could be lost on close).
- **Project duplication.** File > Duplicate project.
- Tests: `tests/quality.test.ts`, `tests/snapshots.test.ts` (run with `npx tsx --test`; they need no AtomAttr engine). Files: document/{quality,types}.ts, state/{snapshots,store,storage}.ts, panels/{Checks,Panels}.tsx, components/Topbar.tsx.

## What's New, universal dialogs, glass New project (v0.2.0)
Steps 3 and 4 of the premium-polish pass, plus the New project dialog fix. Every edit is an AtomAttr attribute; no new CSS framework. The only CSS added is one `prefers-reduced-motion` rule next to the existing keyframes in styles.css.
- **New project dialog is glass now.** It was still hard-coded to a solid `#fff` / `grey-900` surface with `shadow="xl"`. It now uses `T.panel` (the same frosted surface as every other dialog), the cards are tinted glass (`gray-900/5` / `white/6`, accent tint when selected, 2px border kept transparent so nothing shifts) and Cancel uses `T.card`. Layout, size and order are unchanged. Also gets the fade/pop entrance.
- **Universal dialogs (no more alert / confirm / prompt).** `state/dialogs.ts` is a small promise queue (`confirmDialog`, `choiceDialog`, `inputDialog`, `textDialog`); `components/Dialogs.tsx` renders it in the `T.panel` glass at the top of the stack (`<DialogHost />` in Workspace). `state/confirm.ts` holds the app's confirmations wired to the existing actions:
  delete project (welcome screen), delete page, reset workspace (Layout menu and the Panels menu), restore snapshot, name a snapshot (input dialog, File menu and Styles panel), custom viewport (one dialog with width and height, validated), and Close to welcome screen (Save / Discard / Cancel when the browser could not keep the latest changes; Save writes a .ast file).
  Behaviour: Esc and the backdrop dismiss, Enter confirms or submits, Tab stays inside, focus starts on Cancel for destructive dialogs and returns to where it was, and keystrokes do not reach the editor's shortcuts while a dialog is open. Dialogs queue one at a time.
- **What's New.** `state/releases.ts` holds the notes (newest first) and `APP_VERSION`; `components/WhatsNew.tsx` is the dialog: version badge, notes grouped New / Improved / Fixed with icons, Dismiss and Explore updates (opens Keyboard shortcuts in the editor), previous releases folded underneath. It opens once per version, about a second after launch and only when nothing else is open; the acknowledged version is kept in localStorage (`atomattr.studio.whatsnew`). Replay and older notes: Help > What's new, or About > Release notes. To ship a new version add an entry at the top of `RELEASES` and bump `APP_VERSION` and package.json.
- Also: `'site-nav'` added to the `Modal` type (it was already used but missing, which broke type-checking).
- **Tests:** tests/dialogs.test.ts, tests/releases.test.ts and tests/dialog-host.test.tsx (jsdom; focus, Esc, Enter, Tab wrap, validation, backdrop, queue, key isolation). `npm test` now also runs `.test.tsx`; jsdom is a new dev dependency.
- **Not done yet:** onboarding (step 2) and toasts (step 5); the existing toast is unchanged. dist/ is the old build: run `npm run build` to refresh it.
- Files: state/{dialogs,confirm,releases,store}.ts, components/{Dialogs,WhatsNew,Welcome,Modals,Topbar,PageTabs,PanelMenu,Workspace}.tsx, panels/Panels.tsx, styles.css, package.json.

## Dark glass polish (step 1 of the premium-polish pass)
Surfaces are now defined by tone instead of outlines. Layout, positions, dimensions and component order are unchanged; every edit is an AtomAttr attribute (no CSS, no inline styles, no new framework).
- **Glass recipe (theme.ts):** restrained blur (18px, saturate 130; was 24px / 160), translucent fills, a faint inner top-light and soft multi-layer shadows via raw `shadow` / `dark-shadow` values. Borders keep their 1px width (so nothing shifts) but are transparent. Accent borders (focus, selection, drop targets, active states), colour-swatch outlines and the canvas guides are untouched.
- **Tokens reworked:** `chrome` (flush bars and docked columns; no blur on purpose, because blur on a bar traps its menus in a stacking context), `panel` / `glassPop` (menus, popovers, dialogs; denser so text stays crisp over any design), `glass` (floating panels), `card`, `field`, `section`, `well`, `hover`, `divider`. New: `hairline` (ghost-line border colour for the few structural edges that stay), `lifted` (dragged panel), `overlay` (dialog scrim: dim plus 6px blur), `canvas` (now actually used by the canvas stage; dark mode gets a very faint accent glow so the glass has something to blur).
- **Applied to:** top bar, docked columns, floating panels, tool rail, pages, zoom, colour palette, menus, command palette, dialogs (including New project), code panel, welcome screen cards, and the opaque `gray-800` tiles / segmented controls in the panels.
- **Not changed:** the existing toast (replaced in the Toast step), anything on the design canvas, export output, project data and storage.
- Files: theme.ts, canvas/Canvas.tsx, components/{CodeDrawer,CodeSplit,ColorDock,Dock,Modals,PanelMenu,PreviewStage,Topbar,Welcome,ui}.tsx, panels/{AnimationPanel,FillPanel,Panels,StylesColours}.tsx.

## Glass, palette layouts, pages clipping, preview theme
- **Glass floating surfaces:** new `T.glass` / `T.glassPop` tokens (theme.ts): 40% white / 35% dark fill, 24px backdrop blur and saturation, light and dark. AtomAttr only accepts pixel values for `backdrop-blur` (named sizes like `xl` produce nothing). Used by floating panels and the bottom sheet (panel bodies are now transparent so it shows), the tool rail, colour palette, zoom bar, pages panel and their popovers.
- **Less rounded:** panels and popovers 6px, buttons, fields and rows 4px (was 8 to 16px and pills). Applied across `components/`, `panels/`, the colour picker and the context toolbar. Design content on the canvas is untouched.
- **Colour palette (ColorDock.tsx):** horizontal or vertical. The last button opens "Palette layout": floating horizontal, floating vertical, dock to the bottom, dock to the right, hide. Drag the grip to an edge (within 10px) and a dashed guide shows where it docks. Placement is saved in the workspace layout (`palette.dock / vertical / x / y`); older saved spots are picked up once.
- **Zoom bar:** glass, with a close button; it folds into a small zoom chip that brings it back. Also View > Zoom controls. It keeps clear of the palette and its show button.
- **Pages clip in:** drag the pages panel to within 56px of the top or bottom of the canvas (dashed guide) or press its pin button, Layout menu > "Clip pages to the bottom/top". It becomes a strip in the canvas column and the canvas shrinks to make room; the palette steps aside. Drag the strip out to float it again.
- **Top bar:** the device-size box (desktop / tablet / mobile and the device list) moved to the right zone.
- **Device preview:** the top and bottom bars follow the editor's light/dark mode and theme colour; new appearance button in the bar (mode and theme colour). The page's own Dark switch is unchanged.
- Screenshot button: not started, as requested.
- Files: theme.ts, state/layout.ts, state/store.ts, components/{ColorDock,ZoomDock,PageTabs,Workspace,Topbar,Dock,ToolPalette,DevicePreview}.tsx plus the radius pass over the other components and panels.

## Top bar, round 3
- **No more overlap:** the bar is three zones with flexible gaps; the left zone (project name) shrinks first, so the device switch can never sit on top of the search or any other button.
- **Responsive:** the bar measures its own width. Under 1240px the search pill goes; under 1000px undo / redo and pages move into a "More" (three dots) button; under 760px preview and appearance (mode and theme colour) move in too, and the logo hides.
- **Save state is a pill** next to the project name showing only the time: green when saved, amber while saving or unsaved, red if the save failed (hover for the words).
- **Layout moved into the Menu** as its own category (presets, tidy panels, palette, floating pages, reset). The Window category now lists panels only.
- All text in the changed files uses `sm`.

## Top bar, round 2
- **Zoom moved out of the bar** into a floating dock at the bottom centre of the canvas, just above the colour palette (`ZoomDock.tsx`): zoom out, level list, zoom in, fit, actual size.
- **Search** is always a labelled pill (icon, "Search", Ctrl K) and the command palette now opens above everything.
- **Layout and Panels menus** show an icon and a name only: no schematic drawings, no descriptions, no "Custom" label (the trigger reads "Layout" when the arrangement is your own).
- **Undo / redo** have room between them; the right-hand buttons are spaced out.
- **Device preview:** the connection list (and every list with a side note) now keeps clear space between the name and its note.
- **Font sizes:** every fixed size of 12.5px or less in the Studio UI is now the `xs` token, 13 to 15px is `sm`. Headings above that are unchanged.

## Top bar redesign (single bar, theme colour)
- **One 52px bar instead of two rows**, in the language of the device preview: 36px round-cornered icon buttons, grouped soft pills, soft popovers, one icon set (`BarIcons.tsx`, 24px grid, 1.8px strokes).
- **Left:** one Menu button (categories on the left, their items on the right; same actions as before), logo, project name with a save-state dot. **Centre:** device size (desktop / tablet / mobile plus the device list) and zoom. **Right:** undo / redo, command search (Ctrl+K), workspace preset, panels, pages, preview, appearance, export.
- **Appearance popover:** Light / Dark, twelve theme colours, any custom colour (picker or hex), reset. The choice is saved and applies to the whole editor through the engine's `--primary` token; the design canvas pins the stock value, so pages you design keep their own colours and export unchanged.
- **Export** opens a small menu (ZIP, runnable React project, preview in a new tab, copy code).
- **Rulers removed**: no ruler on the canvas, no Rulers entry in the View menu, off in saved layouts too (`Rulers.tsx` is left in the project, unused).
- The panel strip was dropped from the bar (the Panels menu covers it).
- Files: `src/components/Topbar.tsx`, `src/components/BarIcons.tsx` (new), `src/components/PanelMenu.tsx`, `src/components/Workspace.tsx`, `src/canvas/Canvas.tsx`, `src/state/store.ts`, `src/state/storage.ts`, `src/state/layout.ts`, `src/theme.ts`.


## P1: dock system (panels, workspace presets, docking)
- **Top bar is the control surface.** The old "Workspace" list is replaced by a workspace preset menu, a searchable Panels menu (Alt+P) and a one-click panel strip. All built with AtomAttr attributes only; no CSS or inline styles were added.
- **Searchable panel menu.** Search by name or by what a panel does ("font", "shadow", "links", "overflow"). Arrow keys and Enter work; each row shows where the panel lives (docked left or right, floating, tab) and can be closed from the row. "Tidy floating" pulls floating panels back into view.
- **Workspace presets:** Design, Typography, Assets, Code and Responsive QA (Alt+1 to Alt+5, also in the Window menu and the command palette). The top bar shows the active preset and switches to "Custom" once the arrangement changes. New default workspace is Design: docked layers on the left, properties on the right, code panel closed.
- **Clear docking targets.** While a panel is dragged, both dock edges light up with a "Dock left / Dock right" target; hovering another panel's title bar shows "Tab with …". Release to apply; Esc leaves the panel floating.
- **Tabbing and separating without losing state.** Panel bodies are rendered once and moved between windows instead of being remounted, so field drafts, open sections, selections and scroll position survive tabbing, tearing a tab out, docking and floating. Dragging a tab out of a group tears it off; dragging a docked panel lifts it out of its column.
- **Sticky headers.** Window title bars never scroll; section headers inside panels now stay pinned while their content scrolls.
- **Floating panels stay inside the workspace** while dragging, resizing, and when the window shrinks.
- **Narrow-window fallback.** Docked columns squeeze first so the canvas keeps at least 360px. Below that (or under 720px wide) docked and floating panels collapse into one bottom sheet showing the most recently focused panel; the others stay one click away in the Panels menu.
- Opening a panel that is closed now adds it as a tab in the right-hand dock when one exists (it floats otherwise). The automatic Typography window on text selection only appears when no right dock exists.
- Tests: `tests/dock-layout.test.ts` covers presets, bounds and the squeeze/sheet thresholds.
- Files: `src/components/Dock.tsx`, `src/components/PanelMenu.tsx` (new), `src/components/Topbar.tsx`, `src/components/Workspace.tsx`, `src/components/ui.tsx`, `src/state/layout.ts`, `src/state/store.ts`, `src/theme.ts`.
- Saved workspaces from earlier versions keep their old arrangement and show as "Custom". Use Reset in the Panels menu or pick a preset.

## Editor behavior and starter template
- Replaced the Shop Front starter with an editorial ecommerce template: responsive flow-based navbar, separate real anchor links, hero, product grid, about band, and footer.
- Page roots now use vertical flex flow so sections stack naturally; sections use content-driven height with a minimum height rather than a rigid fixed height.
- Updated the reusable Navbar block to contain individual anchor nodes for each navigation item rather than one paragraph with concatenated labels.
- Moving a node into flex/grid switches it to flow positioning and clears stale absolute coordinates. Moving it into a freeform parent switches it to absolute positioning and gives it usable coordinates/width when needed.
- Added tests for cross-layout movement and the Shop Front template's semantic navigation and flow layout.

The UI components and styling were not redesigned. Build/test execution still needs confirmation in an environment where the project's npm dependencies install successfully.

## Runtime crash and React warning fixes
- Fixed `AttributesPanel` hook ordering so switching between an empty selection and a selected object does not violate the Rules of Hooks.
- Made canvas stage geometry safe when the stage ref is temporarily unavailable, preventing queued pointer work from crashing on `getBoundingClientRect()`.
- Camel-cased SVG attributes before passing them to React and corrected kebab-case DOM props in JSX that caused React warnings.
- Added the recommended `mobile-web-app-capable` meta tag while retaining the Apple-specific tag for compatibility.

## Templates, preview menus and phone layout
- **Preview works for menus.** Hamburger buttons, dropdowns, tabs, FAQ items and dialogs now react to clicks in the editor's Preview mode (state lives in `document/behavior.ts`, cleared when preview, size or page changes). "Preview in a new tab" now includes the behavior script and styles; before, it had neither, so the menu button did nothing.
- **Navbars stay a row on phones.** The editor auto-stacked every flex row into a column on mobile, so `justify: between` ran vertically. Navbars now set `dir: row` + justify between on tablet and phone; the open menu drops below as a column.
- **Padding by screen size.** Template helpers derive tablet/phone overrides: side padding 72/56 → 32 → 20, vertical padding shrinks, big headings scale down, fixed widths become full width on phones.
- **Eight new templates** replace the old eight: finance, fintech, brand, dress, designer, dashboard, market, velour (+ Blank). The dashboard sidebar folds into the hamburger navbar below desktop.
- Tests: `tests/templates.test.ts` rewritten (responsive rules, navbar, preview click logic).

## Round 5: component library and Animation panel
- **Components** is now a library (`panels/Library.tsx`): search, category tiles with live previews, drill-down to variants with thumbnails, favorites (kept in the browser), and a "My components" view. Searching lists matches across the whole library and your own components.
- **Animation** has its own docker (`panels/AnimationPanel.tsx`, Panels menu → Animation). Presets are grouped In / Highlight / Loop / Out, with a live stage, Slow/Medium/Fast speed, delay, repeat, a draggable easing curve, and trigger (load, scroll, hover). The **Custom** tab animates from chosen starting values (opacity, scale, blur, rotate, offset X/Y).
- Properties keeps a one-line Animation row with an "Open panel" button.
- Custom animations ship their keyframes in every export (`behaviorCss`), so HTML ZIP, single HTML, React and previews all play them. Tests: `tests/animation.test.ts`.

## Round 6: partials closed, tokens, analytics, comments
- Spacing, radius and shadow tokens plus style classes (Styles panel; "Tokens and class" in Properties).
- Library blocks drag to canvas; instance Reset overrides and Detach.
- Interaction roles: scroll-to, theme toggle, copy; click-triggered animations.
- Form submission presets and validation; HTML import; snapshot Compare; external link check.
- Analytics panel (provider snippets, event tags, DNT). No data storage or dashboard.
- Comments panel (threads, replies, resolve, merge from file, export .md). No live co-editing; needs a server.

## Round 7: code tabs, attributes, animation and library redesign, parser, SEO and accessibility
- Custom CSS, JS and Head are now tabs inside the Code panel (Generated, Custom CSS, Custom JS, Custom Head) with a Site / This page switch. The separate Custom code panel is gone from the Panels menu; old layouts that had it open are redirected.
- Custom attributes: a row editor (name, value, remove) with suggestions, live name checks, boolean attributes, and a warning for event handlers. Replaces the one-per-line textarea.
- Animation panel redesigned: label / value pill / slider rows, Linear, Ease and Spring transitions with a larger curve editor, Bezier field, Time and Delay in seconds, a moving easing preview, and live presets on hover. Offsets use steppers.
- Components library redesigned: large preview tiles with the name and variant count beneath, two columns, favorites on the tile.
- Code parser rewritten (tokenizer, notes on what was dropped). Fixes about 30 type errors that were hiding in the old one.
- New site setting: page language (`<html lang>`), used by every exporter.
- New checks: ARIA roles, aria-hidden on focusable, positive tabindex, duplicate ids, target=_blank rel, nested main, iframe titles, target size, reading order, alt-text quality, link names, language, H1 empty/long, thin content, slug format, orphan pages.
- Fixed: Code panel body was laying out as a row (flex-direction attribute), which squeezed the toolbar and editor side by side.

## Round 8
- **Components panel** redesigned after the Frameblox library: Favorites / My components quick chips, tinted category cards (icon, name, count, live preview inside), a cards/list toggle (list = tinted icon square, name, count, chevron, remembered per browser). Columns follow the drawer width (`useCols`).
- **Animation panel**: preset cards with a stage and a mini UI card that replays on a shared loop (paused for reduced-motion), tinted per group, selected ring, two per row at drawer width, more when wider.
- **Pins removed** from panel headers and the pages strip. Drag the grip (or the header) to the left/right edge to dock, drag out to float.
- **Tools rail**: floating vertical/horizontal, dock left/right/top/bottom, from the new layout button (last in the rail) or by dragging to any edge. Popovers render in a portal so they are never clipped.
- **Colour palette**: docked bottom/right now fills the bar; all colours show.
- **Used colors panel** (Panels > Design): every fill/border/text/tint colour across pages, states and gradient stops; click selects the objects, Replace everywhere (one undo step), Add to palette, Copy hex. Tests in `tests/colors.test.ts`.

## Round 8b
- **Icons** (Assets > Icons): results load in one batched request and draw as inline SVG, so none show blank or half-loaded, they follow the theme, and a click places the icon without a second download. Icons a pack lacks are skipped instead of leaving empty tiles. Suggestion chips fill the empty state.
- **Used colors** now uses compact 28px swatches like the colour palette (hover for hex, uses, roles; click to select the objects and open Replace / Add to palette / Copy).
- **Web fonts** (Typography and Settings panels): add a Google Fonts family by name and weights (checked against Google), any https stylesheet (Bunny, Adobe, your CDN), or an uploaded .woff2/.woff/.ttf/.otf (up to 1.5 MB, stored in the project). Added fonts appear in the Family list, load on the canvas and preview, and export as `<link>` / `@font-face` in every page head (static site, React project and HTML export). Tests: `tests/fonts.test.ts`.

## Round 9a
- Colour swatches are circles: Used colors (22px) and the palette dock (docked bars spread the circles evenly across the bar).
- Segmented controls never squeeze labels: options that do not fit move into a "..." menu, and the chosen option always stays visible. Applies everywhere `Seg` is used (Animation In / Out / Highlight / Loop / Custom, comments filters, fill and layout controls).

## Round 9b
- **States panel** (Panels > Design): Hover, Focus, Pressed, Disabled and Dark mode in their own panel, separate from Attributes. Pick a state and every change in Properties, Typography, Fill and Effects applies to that state only (a banner shows which state you are editing). Lists what the state changes with per-item reset, quick looks (Lift, Grow, Press in, Dim) and the transition time.
- **Every property can change in a state**, not just colours: size, spacing, radius, shadow, transform, text and more are exported as `hover-*`, `focus-*`, `active-*`, `disabled-*` and `dark-*` attributes and CSS.
- **Margin fixed**: text layers reset the browser margin after their own margins, so margins on text never applied in exports. Fixed, with tests. Padding and margin now use a box diagram (top above, left and right at the sides, bottom below), and setting one side no longer wipes the other three.
- **Styles panel** reorganised into tabs (Colours, Text, Scales, Fonts, History) with compact colour tokens that expand to edit.
- **Font weights** are a labelled grid with a live "Aa" sample for each weight (100 to 900).

## Round 9c
- **Inspect panel** now opens with a browser-style box model: margin (orange), border (yellow), padding (green) and content (blue) as nested boxes with the number on every side. Click any number to change it; setting one side keeps the others.
- **Properties**: padding and margin are back to the Top / Right / Bottom / Left fields you liked. The one change under the hood is that setting a single side no longer clears the other three.
- **Preview popovers** (connection throttling, appearance and colour mode): they now sit clear of the toolbar with proper padding, taller rows, and the footer text no longer overlaps.

- Preview: more breathing room between the top toolbar and the device (top padding 84 → 108px), so the frame no longer sits against the headings bar.

## Round 9d
- **Box model (Inspect)** redesigned: tighter nested layers with a small label on each, rounded editable number chips, width and height stacked in the centre, and it now fits the panel width.
- **Dark mode (preview)** no longer inverts the whole page, which turned dark sections light. Each element's colours are remapped: pale backgrounds become charcoal, dark text becomes light, brand colours and already-dark sections stay, photos are never touched. The dark button now opens a small panel with an on/off switch and a Softness slider.
- **CMS panel**: empty state explains the three steps. With a collection, tabs are Items, Fields, Use it and Import / export, and extra tabs fold into the "…" menu. "Use it" lists the four steps and click-to-copy {{field}} chips.
- Preview top padding increased so the frame clears the toolbar.

## Round 9e: navbars
- **Fixed on phones:** brand and menu button no longer stack vertically; every navbar row is pinned to one line at tablet and mobile (this affected the old hamburger navbar too). Desktop links no longer spread across the bar, and the button text no longer wraps.
- **Sticky bars work in exports:** the page root now uses `overflow: clip` instead of `hidden` in exported pages, so `position: sticky` is no longer defeated by a clipped scroll container. The editor keeps `hidden`.
- **New navbars (Components > Navigation):** Sticky navbar, Floating pill navbar (fixed, frosted), Navbar with left drawer, Full-screen menu navbar, Bottom sheet menu, Bottom tab bar (phones only, fixed to the bottom), App header (centered title, sticky). The side drawer and hamburger navbars stay. The dropdown on sticky and floating bars opens over the page instead of pushing it down.

## Round 10: heroes and navbars
- **Hero group rebuilt (8 variants):** Centered, Split (image right), Split (image left), Image background, Gradient, Email signup, Stats, Editorial big type. Headings and text step down on tablet and phone, padding shrinks, split heroes stack, the signup field and button stack on phones and the stats become one column. The four old heroes were not responsive and are replaced.
- **Navbars:** navigation bars are now added at the top of the page instead of the end. Library thumbnails show fixed and sticky bars in place (the floating pill was drawn in the wrong spot) and show the phone-only tab bar.
- New tests in `tests/kit.test.ts` for the hero group and the navbar variants.

## Round 10b: Unsplash placeholder photos in heroes
- The image hero and the split heroes now start with Unsplash placeholder photos (office, team, workspace) instead of a gradient. The photo is linked, not embedded, and the first time a hero is added its photo appears in Assets as "Office (Unsplash)" and so on. A gradient stays underneath so a hero is never blank if the photo cannot load. Replace the photo from Fill → Background image.
- Exported pages link the photo from images.unsplash.com, so they need internet to show it. The links are in `STOCK` in `src/panels/kit.ts` if you want to change the pictures.

## Round 11: controls, loaders, animated buttons, footers, forms

**Buttons (finishing the audit).** Dropdown menu now stacks above following content; the browser focus outline no longer doubles the ring; icon-only and hamburger buttons are true 44 × 44 circles (`minH` is set with `h`).

**New library groups** (Components panel, each with sub-headings):
- **Checkbox** (10 new styles + 4 layouts): classic, pop, round, soft tick, drawn tick, minus, cross, neon, heart, star; checkbox list, cards, terms, select-all.
- **Switches** (9 styles + 4 layouts): classic, square, outline, tick, ON/OFF text, bouncy, slim, gradient, neon; settings row, settings list, side labels, switch card.
- **Radio and choices**: 6 radio styles (dot, filled, tick, glow, ripple, squared), plan cards, radio cards, segmented control, pill choices, survey question.
- **Dark mode toggles** (8): sun/moon pill, day/night sky, icon button, eclipse, Light/Dark segments, label button, switch, settings row. They flip `<html class="dark">` through the existing Switch light / dark behavior.
- **Loaders** (27): spinners, dots, bars, ripples, skeletons, typing indicator, loading card. All are plain nodes with animation presets.
- **Animated buttons** (24): lift, grow, 3D press, neon, sweep, fill-up, shine, gradient flow, rainbow border, arrow slide, text swap, underline, pulse rings, bounce, float, tada / shake / rubber / jello, ripple, celebrate, copy code.
- **Forms and inputs** (22): sign in / up / reset, centred and split sign-in pages, contact (card and section), feedback with rating, comment box, fields with label / error / success / icon, select + textarea, preferences with switches, newsletter (inline and card), search bar, waitlist, payment, verification code.
- **Footers** (8): four columns, dark with social, newsletter, app badges, one line, centred, big call to action, contact details.

**Engine changes behind them**
- New input kind **Radio** (Fields tab: value sent, selected by default); radios with the same Name form a group, and inserted groups get unique names. Works in the editor, HTML, React and exports.
- `document/ui-css.ts`: component rules (checked looks, switch thumbs, dark-mode reactions, button pseudo-elements). A node opts in with `data-ui="…"`; exports and previews include only the rules a page uses; the accent is the node's own Color.
- 15 new animation presets (Loop group, also in the Animation panel): spin backwards, dot bounce / fade / scale, bar grow, ripple ring, sliding bar, wave, blink, square turn, ball bounce, shadow squash, hourglass, shimmer, fill across.
- Library: items can carry a `section`, shown as sub-headings inside a group.
- Old single Footer, Text / Email / Select input, Contact form, Sign-in form and Newsletter signup are replaced by the new groups.

**Where to edit:** `src/panels/kit-controls.ts` (checks, switches, radios, dark mode), `kit-motion.ts` (loaders, animated buttons), `kit-pages.ts` (footers, forms), `src/document/ui-css.ts` (shipped rules).

## Round 12 — accordions, cards, image cards/pills, testimonials, socials, tooltips, ranges, alerts, toasts, modals, app screens, blocks

Thirteen new Library groups, each 18–33 variants arranged under sub-headings:
- Accordions (30), Cards (29), Image cards (33), Image pills (30), Testimonials (28), Social links (27), Tooltips (22), Range inputs (~25), Alerts (~26), Toasts (18), Modals (24), App screens (24), More blocks (26).
- New files: `panels/kit-content.ts`, `kit-media.ts`, `kit-social.ts`, `kit-overlays.ts`, `kit-app.ts`; CSS in `document/ui-css-{content,media,overlays,app}.ts`.
- New input kind `range` (min/max/step/value) in the model, canvas, HTML and React export, and the Properties panel.
- 25 more stock photos (portraits, places, products, interiors).
- Tests: `tests/kit-batch2.test.ts` checks every group has enough items, every item builds and every `data-ui` id has CSS.

Honest limits:
- Toasts have a close button but no auto-dismiss timer.
- Range fill colours use CSS tricks; styled thumbs/tracks work in current Chrome, Safari and Firefox.
- Tooltips and image-card effects are CSS hover/focus; on touch they show their open state.
- Photos are Unsplash links (need internet when viewing); not verified offline.
- App screens/blocks are static layouts, not wired to data.

### Round 12 fix — pictures
- All placeholder photos are now built-in generated SVG artwork (no Unsplash links), so image cards, image pills, testimonials, blocks etc. always show a picture, offline and in exports. Replace any of them with your own photo in the Assets panel.
- Width-capped blocks centre themselves.
- Reverted placeholder pictures to real Unsplash photos (linked); each box keeps a soft gradient underneath as a fallback. Image pills and chips are now centred in their section. (The built-in SVG artwork stays in `document/stock.ts` for templates and the Fill panel.)

## Round 13 — navigation, radio, footers
- **Navigation** now has 8+ in each of six types: Navbars, Menus (account, mega, select, actions, notifications, language, split button), Tabs (underline, pills, soft, segmented, dark, icons, counts, vertical), Breadcrumbs, Pagination, Sidebars (light, dark, badges, groups, user, icon rail, search, mobile drawer). Total 59 items. New `panels/kit-nav.ts`, `document/ui-css-nav.ts` (tab looks `tb-*`).
- **Radio** +8 layouts (payment methods, rating scale, colour swatches, yes/no, time slots, icon tiles, billing switch, divided list): 19 total.
- **Footers** +16 (five columns, grey, brand colour, dark newsletter, accent line, split, legal only, social first, stacked, CTA card, photo, app download, payment badges, region pickers, giant wordmark, big headline): 24 total.
- Tests: `tests/kit-batch3.test.ts`.
- Caveats: menus and tabs use the existing Panel / Tab behavior, so they work in exports; breadcrumbs, pagination and sidebars are static styling (links go to #).

### Round 13b — heroes
- Hero grows from 8 to 23: centred (email signup, stats, logo strip, dark, glass card, big headline, product window, search), split (signup card, product window, two photos, testimonial, phone app), photo (left aligned, video button, feature strip). New `panels/kit-hero.ts`; the hero helpers in `kit.ts` are now exported.

### Round 13c — switches, checkboxes, toasts
- Switch 13 → 20 (sun/moon, icon list, status text, compact list, coloured, master + options, plan add-ons). Checkbox 18 → 22 (filter chips, checklist with progress, two-column topics, filter list with counts). Toasts 18 → 22 (two actions, accent edge, top banner, confirm Yes/No).

### Round 13d — dark mode toggles
- Dark mode toggles 8 → 20: warm sunrise, squared, black and white, ocean, glowing ring, half and half, flip tile, frosted glass, neon, line and dot, word button, bare icon. All use the Theme behavior (class `dark` on `<html>`). New `document/ui-css-dm.ts`. This is the toggle only; the full dark-mode system for every block is still to do.

## Round 14 — CMS item pages (one page per item)
- **The gap:** collections and repeaters could list items on a page, but an item had no page of its own.
- **Item page:** a page can now be the template for a collection (`Page.templateOf`). CMS panel > Use it now explains the two jobs in plain words: A) show a list on any page, B) give every item its own page, with a button "Make the <collection> item page" that adds a page with the fields already placed ({{title}}, image, text, back link).
- **Export:** every published item gets its own file, e.g. `blog-my-first-post.html`, with its own content, SEO title/description, CSS and AtomAttr copy. Drafts get nothing. The template page itself is not exported. Two items with the same title get `-2`. Files are flat on purpose so links and assets work on any host.
- **Links:** `{{item-url}}` (and `{{item-slug}}`) are new fields on every collection. Put `{{item-url}}` on a card's link and it opens that item's page.
- **Page address:** choose which field names the address (default: first Text field).
- **Checks:** unknown {{field}} on an item page, a deleted or empty collection, and `{{item-url}}` with no item page are flagged in the quality list. Item pages show a ◧ mark in the page tabs.
- **Limits:** static site export only (the React export leaves item pages out); the editor shows `{{fields}}` as typed, not a live sample; the Studio panel could not be rendered in the sandbox (the `atomattr` package isn't installed there), so the panel itself is checked by the type checker only. Tests: `tests/cms-item-pages.test.ts`.

## Round 15 — Library cards, Save and views, border beams, animated backgrounds
- **Library variant cards** redesigned: a rounded stage with no outer card background, no icon chips and no add button. Click the stage to add it, or drag it. The name sits on the left; a view counter and **Save** with its counter sit on the right. Save replaces the old star favourite and the view is now called "Saved".
- **Categories** are uniform: live preview, name, one-line description and count, with no tints or icon chips (cards and list).
- **Expand** opens the library in a wide overlay (up to six columns, taller stages). Adding a block closes it.
- **Counters are per browser** (localStorage). A global count would need a server, which Studio does not have. A card counts one view the first time it is shown.
- **Animation panel → Effects tab**: 12 border beams (glowing light travelling round the edge) and 12 animated backgrounds (aurora, gradient shift, mesh, moving grid, dots, stars, waves, spotlight, stripes, sunset, ocean, shimmer). Click to add to any selected object, click again to remove; one beam plus one background can be combined. Implemented as `data-ui` tokens (`ui-css-fx.ts`), so they export with the page.
- Not rendered in the sandbox: the React panels (the atomattr package isn't installed here). Type-checked, and the effect CSS was checked in a browser.

## Round 15b — Import anything
- **File → Import HTML, CSS, JS, React, Word…** (also in the Export panel): one window with drop, choose or paste. Several files at once is fine, and the type is detected from the name or the pasted text.
- HTML (rebuilt as objects), React .jsx/.tsx (static markup, same-file components expanded, lists sampled, state/props/handlers dropped), CSS (added to site CSS, or used to style an HTML/React file dropped with it), JS (added to site JS; runs on the exported site only), Word .docx (headings, text, lists, tables, links, pictures), Markdown and text, SVG (vector), CSV (Data collection).
- Not possible without a server or real parser: PDFs, running React with state, linked stylesheets that are not dropped with the page.
- Library cards follow the 21st.dev and UIverse references: dark variant cards with an eye (views) and bookmark (saves) icon and count instead of words; category cards are soft gradient tiles with a floating preview, name, description and count.

## Round 15c — Image cards and pills
- Every image card now sits in a frame with 20px side room, so Destination ("Zanzibar"), Speaker and the other full-bleed cards no longer touch the edge.
- From Polaroid down, the layouts are real CSS grids (each cell takes its full column width) with more content: Polaroid wall (3), Polaroid pinboard (6), Photo strip (8), Bento grid (1 + 2x2), Bento mosaic (7), Magazine (lead + 3 stories), Masonry (4 columns x 3), Collection tiles (6).
- Image pills and their buttons are centred (minimum height, content centred), including the "All" filter chip and the Join/Follow buttons.
- Pill rows with a growing text column (person lists, follow, banners) keep content to the left; compact pills centre theirs.
- Trailing buttons in pills (Join, round arrow, Play, Follow) are centred on the pill height with a fixed size.

## Round 16 — Dark mode for every block
- New `document/auto-dark.ts`: every Library block (except the dark-mode toggles, which have their own) now gets a `states.dark` look when it is inserted. White and pale surfaces become deep slate, pale brand tints keep their hue but go deep, dark text turns light (graded), pale borders darken, dark buttons turn light with a dark label. Brand colours, photos, gradients and white text on photos are untouched, and a node that already has its own dark look is left alone.
- It exports as `html.dark …` rules, so it follows the page's dark class: use any Dark mode toggle from the Library, or the editor's dark preview.
- Limits: hover colours are not re-mapped in dark mode (the dark fill stays on hover), and gradients are not converted. Check a block in the dark preview and adjust with the Style panel's dark state if needed.

## Round 17 — Beta readiness
- Type check is clean (14 errors to 0). Four were real bugs: three panels had their rounded corners or border overwritten by a theme spread, plus a possible null project in page ordering.
- **Crash guard**: if the editor crashes, a plain screen offers Reload, Download project backup and Copy error details; the project is saved first.
- **Send feedback or report a problem** (Help menu, About, the BETA badge): copy or download a report with browser, screen, project size and recent errors (no project content), download a project backup, and read the known limits. Set `FEEDBACK_EMAIL` in `state/diagnostics.ts` to add an Email button.
- BETA badge in the top bar; About shows the version (0.3.0-beta.1).
- `BETA.md`: tester guide with a 30-minute checklist.
- Not verifiable in this sandbox: `vite build` (a path to the atomattr package fails here) and the React panels rendering.
- Image pills: every pill sits in a frame with room above, below and at the sides; the Lake Bosomtwe place pill has a fixed width with its arrow centred at the end.
- Status dots now sit on the bottom-right corner of the avatar (person pills, list, team presence).
