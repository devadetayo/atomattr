# AtomAttr Studio — Feature Audit (v0.2.0)

Method: static read of the source in `studio.zip` (13.7k lines, 135 files), README/CHANGES cross-checked against the code. **Not run in a browser**: the zip depends on the parent AtomAttr repo (`atomattr: file:..`, `../src/index.js`), so the app cannot build here. Existing tests that import the editor store also need that engine. I ran only the new pure-logic tests and `tsc` (46 pre-existing type errors, unchanged by my edits). No UI behavior below was observed live.

Status key: **Full** · **Partial** · **UI only** · **Missing**. "Fixed" = completed in this pass.

## Summary
Strong visual-design core and static export; no backend. CMS (except dynamic template pages), custom code, image optimization and performance analysis were added in round 3. Nothing in publishing/hosting, collaboration, GitHub, analytics or AI exists. Quality inspector and version history were the main partials; both improved here.

## 1. Visual editor and design tools
| # | Feature | Status | Evidence / what remains |
|---|---|---|---|
| 1 | Drag-and-drop editor | Full | `canvas/Canvas.tsx` (919 lines): move, resize, reorder into flex/grid slots, tests in document-ops. README: pen/transform/undo browser pass incomplete. |
| 2 | Device frames preview | Full | `DevicePreview.tsx`, `PreviewStage.tsx`, `state/devices.ts`; phone frame, landscape, dark, network throttle labels. |
| 3 | Custom viewport | Full | Custom viewport dialog (`state/confirm.ts`), drag-resize in PreviewStage. |
| 4 | Multi-page | Full | `PageTabs.tsx`, `duplicatePage`, slugs, nav, parent/order, shared header/footer. |
| 5 | Reusable components | Full | Components docker with drag-to-canvas, search, favorites, categories; instances via `inst`/`ov`. |
| 6 | Component editing | Full | Selected-instance controls: reset overrides, detach to plain nodes. |
| 7 | Global design system | Full | Colour, spacing, radius and shadow tokens, linked text styles, font stacks. |
| 8 | Global colour/type | Full | Tokens (light/dark roles), text styles, find-and-replace token. |
| 9 | Spacing/design tokens | Full | Spacing, radius and shadow tokens (propagate on edit; unlink on manual change) with default scale. |
| 10 | Variants/reusable styles | Full | Style classes: capture from selection, apply, sync, detach, usage counts. |
| 11 | Layers/nesting | Full | Layers panel, group/ungroup, tree ops. |
| 12 | Align/distribute | Full | `alignNodes`, `distributeNodes`, Align panel. |
| 13 | Visual interaction builder | Full | Roles now include scroll-to, theme toggle, copy; plus Animation panel triggers (load/scroll/hover/click). |
| 14 | Animations/transitions | Full | `animations.ts` presets, trigger load/scroll/hover; per-state transition + easing. |
| 15 | Hover/click/scroll | Full | Hover/focus/active/disabled/dark states, click via roles/animation, scroll via animation trigger. |

## 2. Developer tools
| # | Feature | Status | Notes |
|---|---|---|---|
| 16 | HTML export | Full | `exporters/site.ts` ZIP with SEO/OG meta, per-page CSS. |
| 17 | CSS export | Full | `exporters/css.ts`. |
| 18 | JS export | Full | Generated `behavior.js` plus user custom JS and head HTML (exports only, never run in previews). |
| 19 | React export | Full | `react-project.ts`; README: installed and built in a clean dir. Static routing by pathname only, no router, repeaters statically expanded. |
| 20 | AtomAttr in exports | Full | Per user: loads from CDN. |
| 21–23 | Custom CSS / JS / HTML | Full (round 3) | Project- and page-level CSS, JS and head HTML plus an HTML embed node; included in every export. JS/head are never run in Studio previews; embeds are sandboxed. |
| 24 | Code editor in Studio | Full | Editable code panel + Prettier + Apply. The reader is now a real tokenizer (quotes and braces may contain `>`), skips head/script/style, keeps semantic tags and ids, turns form controls into inputs, keeps inline SVG as an embed, maps inline styles, decodes entities, and tells you what it could not carry over. Custom CSS, JS and Head live in tabs of the same panel. |
| 25 | External project editing | Partial | Best-effort HTML import (script-less sandbox, converts to nodes); no React project import. |
| 26 | GitHub | Missing | Only a syntax-theme name matches. |
| 27 | Version history/restore | Full | Snapshots with restore and Compare (added/removed/changed objects and settings). |

## 3. Website quality
| # | Feature | Before | After this pass |
|---|---|---|---|
| 28 | SEO inspector | Full | Title/description presence and length, duplicates, social image, site URL, page language (new setting), H1 empty/long, thin content, slug format, orphan pages, alt-text quality. |
| 29 | Accessibility | Full | Contrast (light and dark), input labels, link/button names (aria-label counts), heading order, ARIA role validity, aria-hidden on focusable, positive tabindex, duplicate ids, target=_blank rel, nested main, iframe titles, target size, reading order vs visual order in free layouts, alt-text quality. Rendered checks (overflow, tap targets) in the Checks panel. Automated checks cannot replace a screen-reader pass. |
| 30 | Broken links | Full | Adds opt-in external link reachability check (no-cors, 7s timeout); results are best-effort. |
| 31 | Missing alt | Full | `alt` rule (images only). |
| 32 | Responsive overflow | Full | Rendered DOM scan per breakpoint (`Checks.tsx`); also tap-target and small-text. Only measures against page bounds. |
| 33 | Performance analysis | Full (round 3) | Score from the real export: bytes by type, request count, modelled Fast 4G/Slow 4G/3G load, perf-* rules (`performance.ts`). Load times are a model, not a lab measurement. |
| 34 | Heading structure | Full | H1 count and level skips. |
| 35 | Image optimization | Full (round 3) | Resize to 2400px and WebP re-encode on import (alpha kept; SVG/GIF/tiny skipped) plus an Optimize all button. |

## 4. CMS and dynamic content — all Missing except
| # | Feature | Status | Notes |
|---|---|---|---|
| 36, 37, 40, 41, 43, 44 | Collections, typed fields, items, filter/sort, CSV/JSON import/export | Full (round 3) | CMS panel and `cms.ts`/`cms-io.ts`; draft/published items. |
| 39 | Dynamic template pages (one page x N items), blog, dashboard | Missing | Not built. |
| 38 | Dynamic binding | Full (round 3) | `{{field}}` binding in repeaters, now to a collection (CSV still works). |
| 42 | Lists/repeaters | Full (round 3) | Collection source with filter, sort and limit; statically expanded in exports. |

Suggested CMS v1 (as your colleague said): collections + typed fields + a data table editor, then bind repeaters to a collection instead of CSV, then template pages (one page × N items), filter/sort last.

## 5. Project management and collaboration
| # | Feature | Status | Notes |
|---|---|---|---|
| 45 | Autosave | Fixed | 800 ms debounce to IndexedDB existed; added flush on tab hide/close. |
| 46 | Backup/recovery | Fixed | 21st project previously deleted the oldest from IndexedDB; removed. `.ast` export exists. No cloud backup. |
| 47/48 | Version history/restore | Partial → improved | Manual named snapshots existed; added automatic restore points (10 min, last 10), asset-safe restore. No diff/compare, no per-page restore. |
| 49 | Duplicate project | Fixed | File > Duplicate project (page duplicate already existed). |
| 50 | Import/export | Full | `.ast` archive (`project-file.ts`, `ast.ts`), legacy JSON/ZIP open. |
| 51, 52 | Collaboration, comments | Missing | No server. |
| 53 | Shareable previews | Partial | Preview in new tab is a local blob; nothing shareable without hosting. |

## 6. Publishing and deployment
| # | Feature | Status |
|---|---|---|
| 54–58 | Publishing, domain, SSL, hosting, deploy updates | Missing (README: "hosting/publishing is not included"; ZIP only) |
| 59 | Analytics | Partial | Provider snippets (Plausible, GA4, Umami, custom), DNT respected, event tags. No storage or dashboard (needs a server). |
| 60 | Form submission | Full | Form panel: provider presets (Netlify, Formspree, custom), action/method validation, checks updated. |

## 7. AI — all Missing (65: partly adjacent, a11y checks are rule-based, not AI)
Nothing calls a model; the only network use is an icon search API.

## Counts (65 features)
Full 31 · Partial 18 · Missing 16 · UI-only 0 (counted from the tables above, after round 3; 4 of the Full items and 4 of the Partial ones were promoted by the fixes). I found no dead buttons in the files I read, but I did not read every panel line by line.

## Recommendation
**Before launch:** custom CSS/JS/HTML (#21–23), form action/endpoint UI (#60), spacing tokens (#9), image optimization on import (#35), HTML export self-contained option (#20), real preview sharing or one-click hosted publish (#53/54) — decide whether launch is "design tool + export" or "platform".
**CMS v1 (if in launch scope):** collections, fields, repeater↔collection binding.
**Later:** collaboration/comments, GitHub, analytics, AI, CMS filter/sort/import-export, performance analysis, SSL/domains (comes with hosting).

## Limits of this audit
Static read only; no live testing of the editor; I did not trace every control in the 659-line Panels file. Counts are my classification and approximate. Items I classified from README plus targeted code reads (5, 6, 10, 13, 15, 20) deserve a hands-on check.

## Round 8
Verified in a browser build: Components cards/list, Animation cards, Used colors (select + actions), tools rail floating-horizontal and docked top/right, palette docked bottom/right fill. `npx tsc` still shows only the 14 pre-existing errors; new colour tests pass. Not verified: dragging the rail to the top/bottom edge by mouse (menu route verified), touch input.

## Round 8b
Browser-verified with mocked network (the build sandbox has no internet): inline icon grid, compact colour swatches, adding a Google font injects its stylesheet and lists it. Not verified against the live Iconify or Google Fonts servers, and font file upload and export output were covered by unit tests, not by opening an exported page.
