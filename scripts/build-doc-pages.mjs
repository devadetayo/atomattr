import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DICTIONARY } from '../src/style-data/dictionary.js';
import {
  BREAKPOINTS,
  FONT_SIZE_SCALE,
  FONT_WEIGHT,
  LINE_HEIGHT,
  RADIUS_SCALE,
  SHADOW_PRESETS,
  SPACING_SCALE,
} from '../src/style-data/variables.js';

const DOCS_DIR = 'docs';
const allKeys = Object.keys(DICTIONARY);

const pageList = [
  ['docs.html', 'Overview', 'Getting Started'],
  ['search.html', 'Search', 'Getting Started'],
  ['installation.html', 'Installation', 'Getting Started'],
  ['syntax.html', 'Syntax', 'Getting Started'],
  ['values.html', 'Values', 'Getting Started'],
  ['responsive.html', 'Responsive', 'Getting Started'],
  ['states.html', 'States', 'Getting Started'],
  ['dark-mode.html', 'Dark Mode', 'Getting Started'],
  ['pseudo-elements.html', 'Pseudo Elements', 'Getting Started'],
  ['layout-display.html', 'Display', 'Layout'],
  ['layout-flex.html', 'Flexbox', 'Layout'],
  ['layout-grid.html', 'Grid', 'Layout'],
  ['layout-alignment.html', 'Alignment', 'Layout'],
  ['layout-gap.html', 'Gap', 'Layout'],
  ['spacing-padding.html', 'Padding', 'Spacing'],
  ['spacing-margin.html', 'Margin', 'Spacing'],
  ['sizing-width-height.html', 'Width and Height', 'Sizing'],
  ['sizing-min-max.html', 'Min and Max Size', 'Sizing'],
  ['sizing-aspect.html', 'Aspect Ratio', 'Sizing'],
  ['positioning.html', 'Positioning', 'Position'],
  ['inset-z-index.html', 'Inset and Z Index', 'Position'],
  ['overflow.html', 'Overflow', 'Position'],
  ['colors-backgrounds.html', 'Backgrounds', 'Colors'],
  ['colors-text.html', 'Text Colors', 'Colors'],
  ['colors-gradients.html', 'Gradients', 'Colors'],
  ['colors-svg.html', 'SVG Colors', 'Colors'],
  ['typography-font.html', 'Font Family and Size', 'Typography'],
  ['typography-weight-line.html', 'Weight and Line Height', 'Typography'],
  ['typography-alignment.html', 'Text Alignment', 'Typography'],
  ['typography-decoration.html', 'Decoration and Case', 'Typography'],
  ['typography-overflow.html', 'Text Overflow', 'Typography'],
  ['borders-width-color.html', 'Border Width and Color', 'Borders'],
  ['borders-radius.html', 'Radius', 'Borders'],
  ['borders-outline-ring.html', 'Outline and Ring', 'Borders'],
  ['effects-shadow.html', 'Shadows', 'Effects'],
  ['effects-opacity.html', 'Opacity', 'Effects'],
  ['effects-transform.html', 'Transforms', 'Effects'],
  ['effects-filter.html', 'Filters', 'Effects'],
  ['effects-backdrop.html', 'Backdrop Filters', 'Effects'],
  ['motion-transition.html', 'Transitions', 'Motion'],
  ['motion-animation.html', 'Animation', 'Motion'],
  ['media-object.html', 'Object Fit', 'Media'],
  ['media-background.html', 'Background Images', 'Media'],
  ['interactivity-cursor.html', 'Cursor and Pointer', 'Interactivity'],
  ['interactivity-scroll.html', 'Scroll Behavior', 'Interactivity'],
  ['html.html', 'HTML', 'Platform Guides'],
  ['react.html', 'React', 'Platform Guides'],
  ['react-native.html', 'React Native', 'Platform Guides'],
  ['react-native-layout.html', 'React Native Layout', 'Platform Guides'],
  ['react-native-inputs.html', 'React Native Inputs', 'Platform Guides'],
  ['tables-lists.html', 'Tables and Lists', 'More'],
  ['accessibility.html', 'Accessibility', 'More'],
  ['tailwind-comparison.html', 'Tailwind Comparison', 'More'],
  ['cheatsheet.html', 'Cheatsheet', 'More'],
];

const pages = Object.fromEntries(pageList.map(([file, label, group]) => [
  file,
  {
    file,
    label,
    group,
    title: label,
    intro: `${label} reference for Atomattr attributes, with focused syntax notes, examples, and the exact CSS properties each attribute controls.`,
    sections: [],
  },
]));

function add(file, title, intro, sections) {
  Object.assign(pages[file], { title, intro, sections });
}

add('docs.html', 'Getting started with Atomattr', 'A clear map of Atomattr: how the attribute syntax works, where each reference page lives, and how to read the examples.', [
  sec('model', 'The model', [
    para('Atomattr styles elements with HTML attributes. Instead of writing a class string and jumping into a stylesheet, you write the styling decision directly on the element: <code>bg="surface"</code>, <code>p="6"</code>, <code>rounded="xl"</code>, <code>border="border"</code>.'),
    code('card.html', `<article bg="surface" p="6" rounded="xl" border="border">
  <h3 font-size="xl" font-weight="bold" mb="2">Profile card</h3>
  <p text="muted">The markup carries the styling contract.</p>
</article>`),
  ]),
  sec('reading-pages', 'How to read these pages', [
    para('Each page is intentionally small. Start with the explanation, copy the example, then use the table to see the supported attributes and the CSS property each one maps to.'),
    cards([
      ['Syntax', 'The grammar behind every attribute.', 'docs/syntax.html'],
      ['Responsive', 'Breakpoint prefixes such as sm, md, and lg.', 'docs/responsive.html'],
      ['Cheatsheet', 'Every registered key in one compact page.', 'docs/cheatsheet.html'],
    ]),
  ]),
  sec('example-flow', 'A real flow', [
    para('Most UI starts by combining layout, spacing, color, borders, and state attributes. The same pattern scales from a small button to a complete page section.'),
    code('product-card.html', `<article display="flex" flex-col gap="4" p="6" bg="white" dark-bg="gray-900" rounded="2xl" border="border">
  <div display="flex" items="center" justify="center" gap="4">
    <h3 font-size="xl" font-weight="bold">Starter plan</h3>
    <span px="3" py="1" rounded="full" bg="primary/10" text="primary">Popular</span>
  </div>
  <p text="muted" line-height="relaxed">Readable attributes, no class soup.</p>
  <button px="4" py="2" rounded="lg" bg="primary" text="white" hover-bg="primary/80">
    Choose plan
  </button>
</article>`),
  ]),
]);

add('search.html', 'Syntax, attribute, and value search', 'Search Atomattr syntax, attributes, CSS mappings, modifiers, and common values from one focused documentation page.', [
  sec('search', 'Search syntax, attributes, and values', [
    para('Use this page when you remember an idea but not the exact Atomattr name. Search for syntax prefixes like <code>hover</code>, <code>dark</code>, or <code>md</code>; attributes like <code>padding</code>, <code>rounded</code>, <code>grid-cols</code>, or <code>bg</code>; and values like <code>primary</code>, <code>xl</code>, <code>6</code>, or <code>shadow</code>.'),
    `<div data-search-page max-w="4xl">
      <label for="attribute-search" display="block" font-weight="700" mb="3">Search attributes, values, and docs</label>
      <div display="flex" items="center" gap="3" bg="gray-50" dark-bg="gray-900" border="border" rounded="2xl" px="4" py="3" mb="4">
        <i class="ri-search-line" text="muted"></i>
        <input id="attribute-search" type="search" placeholder="Try p, padding, hover-bg, primary, grid, React Native..." bg="transparent" border="0" outline="none" w="full" text="text" font-size="md" />
      </div>
      <div display="flex" items="center" justify="between" mb="4">
        <p id="search-total" text="muted" font-size="sm">Loading matches</p>
        <p text="muted" font-size="sm">Results update as you type.</p>
      </div>
      <p id="search-empty" hidden text="muted" bg="gray-50" dark-bg="gray-900" border="border" rounded="2xl" p="5">No matches yet. Try a shorter word, a CSS property, or a token like <code>primary</code>.</p>
      <div id="search-results" display="grid" grid-cols="1" md-grid-cols="2" gap="4"></div>
    </div>`,
  ]),
  sec('examples', 'Useful searches', [
    para('Search is intentionally broad. Attribute results show the Atomattr name, the CSS output, and a sample attribute. Value results show token groups such as spacing, colors, radius, shadows, breakpoints, state prefixes, and syntax prefixes. Page and section results take you directly to relevant docs.'),
    code('search-ideas.txt', `layout: grid, flex, align-items, gap
spacing: p, px, margin, 24px
colors: primary, gray-900, background, text
states: hover-bg, focus-visible, disabled
syntax: dark-bg, md-p, group-hover-opacity, before-content
platforms: React, React Native, HTML`),
  ]),
]);

add('installation.html', 'Installation', 'Install Atomattr, load the base stylesheet, and start the DOM engine for plain HTML or framework usage.', [
  sec('package', 'Install the package', [para('Use the package when you want Atomattr in an app bundle.'), code('terminal', 'npm install atomattr')]),
  sec('plain-html', 'Plain HTML', [para('For static pages, load the defaults stylesheet and browser bundle.'), code('index.html', `<link rel="stylesheet" href="/dist/defaults.css">
<script src="/dist/atomattr.min.js" defer></script>`)]),
  sec('vite-react', 'Vite or React', [para('In an app entry, import the stylesheet and call <code>startAtomAttr()</code>. React components can then emit the same attribute contract.'), code('main.tsx', `import { startAtomAttr } from 'atomattr';
import 'atomattr/defaults.css';

startAtomAttr();`)]),
]);

add('syntax.html', 'Syntax', 'The Atomattr syntax is one consistent shape: a property name, an optional modifier prefix, and a value.', [
  sec('base', 'Base attributes', [para('A base attribute applies at every viewport size and state unless a more specific prefixed attribute overrides it.'), code('base.html', `<button px="4" py="2" bg="primary" text="white" rounded="lg">
  Save
</button>`)]),
  sec('prefixes', 'Prefixes', [para('Prefixes attach to the attribute name: <code>md-p</code>, <code>hover-bg</code>, <code>dark-text</code>, <code>group-hover-opacity</code>, <code>before-content</code>. You can combine supported prefixes when the selector needs both conditions.'), code('prefixes.html', `<article p="4" md-p="8" bg="white" dark-bg="gray-900" hover-shadow="lg">
  The styling changes by breakpoint, theme, and state.
</article>`)]),
  sec('canonical', 'Canonical names', [para('HTML attribute names are the source of truth. Use dashed names such as <code>font-size</code>, <code>min-h</code>, <code>grid-cols</code>, and <code>border-color</code>. React can provide aliases, but it normalizes back to these names.')]),
]);

add('values.html', 'Values', 'Values can be scale tokens, semantic tokens, raw CSS values, or CSS functions depending on the property.', [
  sec('scale-values', 'Scale values', [para('Spacing, sizing, radius, font size, weight, line-height, and shadows have named scales. For example, <code>p="6"</code> maps through the spacing scale, while <code>rounded="xl"</code> maps through the radius scale.'), scale('Spacing scale', SPACING_SCALE)]),
  sec('raw-values', 'Raw values', [para('When you need precision, use regular CSS values such as <code>42px</code>, <code>12rem</code>, <code>calc(100vh - 4rem)</code>, or <code>linear-gradient(...)</code>.'), code('raw-values.html', `<section min-h="calc(100vh - 64px)" bg-gradient="linear-gradient(135deg, #0f172a, #2563eb)">
  Exact CSS values still work.
</section>`)]),
  sec('opacity-suffixes', 'Opacity suffixes', [para('Color-like values can use opacity suffixes such as <code>primary/10</code>, <code>white/80</code>, and <code>gray-950/70</code>.')]),
]);

add('responsive.html', 'Responsive attributes', 'Use breakpoint prefixes to change a value from a viewport width upward.', [
  sec('breakpoints', 'Breakpoints', [table(['Prefix', 'Minimum width'], Object.entries(BREAKPOINTS))]),
  sec('mobile-first', 'Mobile first', [para('Write the smallest layout first, then add larger breakpoint overrides. This keeps markup easy to scan.'), code('responsive-grid.html', `<div display="grid" grid-cols="1" sm-grid-cols="2" lg-grid-cols="4" gap="4">
  <article p="5" rounded="xl" border="border">One</article>
  <article p="5" rounded="xl" border="border">Two</article>
</div>`)]),
  sec('overrides', 'Overriding values', [para('A breakpoint attribute only changes that specific property. Other attributes continue to come from the base rule.')]),
]);

add('states.html', 'State attributes', 'State prefixes map to pseudo-classes such as hover, focus, disabled, checked, invalid, and odd or even children.', [
  sec('interactive', 'Interactive states', [para('Use state prefixes when a style should apply only during interaction or validation.'), code('button-states.html', `<button bg="primary" hover-bg="primary/80" focus-visible-outline="2px" disabled-opacity="50">
  Continue
</button>`)]),
  sec('structural', 'Structural states', [para('Use <code>first</code>, <code>last</code>, <code>odd</code>, and <code>even</code> when repeated elements need alternating or edge styling.'), code('rows.html', `<li odd-bg="gray-50" even-bg="white" first-rounded-t="lg" last-rounded-b="lg">
  Row item
</li>`)]),
  sec('forms', 'Form states', [para('Form controls can use prefixes such as <code>checked</code>, <code>required</code>, and <code>invalid</code> where the browser exposes that state.')]),
]);

add('dark-mode.html', 'Dark mode', 'The dark prefix scopes a rule under the dark theme class on the document.', [
  sec('basic', 'Basic dark mode', [para('Pair base and dark-prefixed values so both themes are readable.'), code('dark-card.html', `<article bg="white" text="gray-950" dark-bg="gray-900" dark-text="white" border="border">
  Theme-aware content
</article>`)]),
  sec('strategy', 'Strategy', [para('Use semantic tokens first. Reach for explicit <code>dark-</code> attributes when a component needs a different shade, border, or contrast treatment in dark mode.')]),
]);

add('pseudo-elements.html', 'Pseudo elements', 'Use before and after prefixes for generated decoration or helper marks without adding extra markup.', [
  sec('before-after', 'Before and after', [para('Pseudo-element attributes are best for small visual marks. Remember that generated pseudo-elements usually need <code>content</code>.'), code('marker.html', `<span relative pl="4" before-content="''" before-position="absolute" before-left="0" before-top="2" before-size="2" before-rounded="full" before-bg="primary">
  New feature
</span>`)]),
  sec('limits', 'Limits', [para('Keep pseudo-elements simple. If the generated content becomes meaningful to the user, put it in real markup instead.')]),
]);

reference('layout-display.html', 'Display', 'Control the display mode of an element.', ['display', 'block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'inline-grid', 'table', 'hidden', 'contents'], `<div display="grid">Grid container</div>`);
reference('layout-flex.html', 'Flexbox', 'Build one-dimensional layouts with direction, wrapping, growth, shrink, basis, and order.', ['flex', 'inline-flex', 'flex-row', 'flex-col', 'flex-row-reverse', 'flex-col-reverse', 'direction', 'grow', 'shrink', 'basis', 'wrap', 'no-wrap', 'wrap-reverse', 'order'], `<div display="flex" flex-col md-flex-row gap="4" items="center">...</div>`);
reference('layout-grid.html', 'Grid', 'Build two-dimensional layouts with columns, rows, spans, and auto-flow.', ['grid', 'inline-grid', 'grid-cols', 'grid-rows', 'col-span', 'row-span', 'col-start', 'col-end', 'row-start', 'row-end', 'auto-cols', 'auto-rows', 'auto-flow'], `<div display="grid" grid-cols="1" md-grid-cols="3" gap="6">...</div>`);
reference('layout-alignment.html', 'Alignment', 'Align items, content, and individual children in flex or grid layouts.', ['justify', 'justify-items', 'justify-self', 'items', 'self', 'content', 'place-items', 'place-content', 'place-self', 'center'], `<div display="flex" items="center" justify="between">...</div>`);
reference('layout-gap.html', 'Gap', 'Set row and column spacing inside flex or grid containers.', ['gap', 'gap-x', 'gap-y'], `<div display="grid" gap="4" gap-y="8">...</div>`);
reference('spacing-padding.html', 'Padding', 'Create inner space with padding attributes.', ['p', 'pt', 'pb', 'pl', 'pr', 'px', 'py', 'ps', 'pe'], `<section px="4" py="10" md-px="8">...</section>`, SPACING_SCALE);
reference('spacing-margin.html', 'Margin', 'Create outer space with margin attributes.', ['m', 'mt', 'mb', 'ml', 'mr', 'mx', 'my', 'ms', 'me', 'mx-auto'], `<main max-w="4xl" mx="auto" mt="8" mb="16">...</main>`, SPACING_SCALE);
reference('sizing-width-height.html', 'Width and height', 'Set element dimensions with width, height, and combined size attributes.', ['w', 'h', 'size'], `<button size="10" rounded="full">...</button>`, SPACING_SCALE);
reference('sizing-min-max.html', 'Min and max size', 'Constrain element dimensions with min and max attributes.', ['min-w', 'max-w', 'min-h', 'max-h'], `<section min-h="screen" max-w="5xl" mx="auto">...</section>`, SPACING_SCALE);
reference('sizing-aspect.html', 'Aspect ratio', 'Reserve stable media and card proportions with aspect ratio.', ['aspect'], `<img aspect="16 / 9" object-cover rounded="xl" alt="">`);
reference('positioning.html', 'Positioning', 'Control positioning mode and offsets.', ['position', 'static', 'relative', 'absolute', 'fixed', 'sticky'], `<header position="sticky" top="0" z="50">...</header>`);
reference('inset-z-index.html', 'Inset and z-index', 'Set physical offsets and stacking order.', ['top', 'bottom', 'left', 'right', 'inset', 'inset-x', 'inset-y', 'z'], `<div position="absolute" inset="0" z="10">...</div>`);
reference('overflow.html', 'Overflow', 'Control clipping, scrolling, and overscroll behavior.', ['overflow', 'overflow-x', 'overflow-y', 'overflow-clip', 'overflow-hidden', 'overflow-scroll', 'overflow-auto', 'overscroll', 'overscroll-x', 'overscroll-y'], `<div max-h="80" overflow-y="auto">...</div>`);
reference('colors-backgrounds.html', 'Backgrounds', 'Set background colors and background rendering behavior.', ['bg', 'bg-color', 'bg-image', 'bg-size', 'bg-position', 'bg-repeat', 'bg-attachment', 'bg-clip', 'bg-origin'], `<section bg="primary/10" dark-bg="gray-900">...</section>`);
reference('colors-text.html', 'Text colors', 'Set foreground text color using semantic tokens, palette tokens, or raw CSS colors.', ['color', 'text', 'text-color', 'caret-color', 'accent-color'], `<p text="muted" hover-text="primary">Readable supporting copy.</p>`);
reference('colors-gradients.html', 'Gradients', 'Use background-image or gradient helper attributes for richer backgrounds.', ['bg-gradient', 'from', 'via', 'to'], `<div bg-gradient="linear-gradient(135deg, var(--primary), #111827)" text="white">...</div>`);
reference('colors-svg.html', 'SVG colors', 'Style SVG fill, stroke, and stroke geometry.', ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset'], `<svg stroke="primary" stroke-width="2" fill="none">...</svg>`);
reference('typography-font.html', 'Font family and size', 'Set font family and text size.', ['font-size', 'text-size', 'font', 'family'], `<h1 font-size="4xl" md-font-size="6xl">Big headline</h1>`, FONT_SIZE_SCALE);
reference('typography-weight-line.html', 'Weight and line height', 'Control typographic weight, leading, tracking, and spacing.', ['weight', 'font-weight', 'leading', 'line-height', 'tracking', 'letter-spacing', 'word-spacing'], `<p font-size="lg" leading="relaxed" weight="medium">...</p>`, { ...FONT_WEIGHT, ...LINE_HEIGHT });
reference('typography-alignment.html', 'Text alignment', 'Align text and inline content.', ['align', 'text-align', 'vertical-align'], `<p align="center" md-align="left">Responsive copy.</p>`);
reference('typography-decoration.html', 'Decoration and case', 'Apply text decoration, decoration styles, casing, and italic state.', ['decoration', 'text-decoration', 'decoration-color', 'decoration-style', 'decoration-thickness', 'underline', 'line-through', 'no-underline', 'text-transform', 'uppercase', 'lowercase', 'capitalize', 'normal-case', 'italic', 'not-italic', 'font-style'], `<a underline decoration-color="primary" uppercase tracking="wide">Link</a>`);
reference('typography-overflow.html', 'Text overflow', 'Control wrapping, truncation, hyphenation, columns, and list presentation.', ['text-overflow', 'truncate', 'text-ellipsis', 'text-clip', 'whitespace', 'white-space', 'word-break', 'overflow-wrap', 'hyphens', 'text-indent', 'columns', 'col-count', 'col-width', 'col-gap', 'list-style', 'list-position'], `<p truncate max-w="64">This long line will be clipped with an ellipsis.</p>`);
reference('borders-width-color.html', 'Border width and color', 'Set border widths, sides, colors, and styles.', ['border', 'border-width', 'border-color', 'border-style', 'border-t', 'border-b', 'border-l', 'border-r', 'border-x', 'border-y', 'border-t-color', 'border-b-color', 'border-l-color', 'border-r-color'], `<article border="1px" border-color="gray-200" dark-border-color="gray-800">...</article>`);
reference('borders-radius.html', 'Radius', 'Round all corners or specific corners.', ['rounded', 'radius', 'rounded-t', 'rounded-b', 'rounded-l', 'rounded-r', 'rounded-tl', 'rounded-tr', 'rounded-bl', 'rounded-br', 'rounded-ss', 'rounded-se', 'rounded-es', 'rounded-ee'], `<img rounded="2xl" md-rounded="3xl" alt="">`, RADIUS_SCALE);
reference('borders-outline-ring.html', 'Outline and ring', 'Style focus outlines and ring-like shadows.', ['outline', 'outline-color', 'outline-style', 'outline-offset', 'outline-none', 'ring', 'ring-color', 'ring-offset'], `<button focus-visible-outline="2px" outline-color="primary" outline-offset="2px">Focus me</button>`);
reference('effects-shadow.html', 'Shadows', 'Apply box shadows, text shadows, drop shadows, and shadow color.', ['shadow', 'shadow-color', 'text-shadow', 'drop-shadow'], `<article shadow="xl" hover-shadow="2xl">...</article>`, SHADOW_PRESETS);
reference('effects-opacity.html', 'Opacity', 'Control element opacity for base, hover, and disabled states.', ['opacity'], `<button opacity="100" disabled-opacity="50">Submit</button>`);
reference('effects-transform.html', 'Transforms', 'Compose transform attributes for movement, rotation, scaling, and skew.', ['transform', 'transform-origin', 'transform-style', 'backface', 'perspective', 'scale', 'scale-x', 'scale-y', 'rotate', 'translate-x', 'translate-y', 'translate-z', 'skew-x', 'skew-y'], `<button hover-translate-y="-1" hover-scale="105">Lift</button>`);
reference('effects-filter.html', 'Filters', 'Apply CSS filter functions.', ['filter', 'blur', 'brightness', 'contrast', 'grayscale', 'hue-rotate', 'invert', 'saturate', 'sepia'], `<img grayscale="100" hover-grayscale="0" transition="filter" alt="">`);
reference('effects-backdrop.html', 'Backdrop filters', 'Apply filter effects to the content behind an element.', ['backdrop-filter', 'backdrop-blur', 'backdrop-brightness', 'backdrop-contrast', 'backdrop-grayscale', 'backdrop-hue-rotate', 'backdrop-invert', 'backdrop-opacity', 'backdrop-saturate', 'backdrop-sepia'], `<div bg="white/70" backdrop-blur="md">...</div>`);
reference('motion-transition.html', 'Transitions', 'Control transition property, duration, timing, and delay.', ['transition', 'transition-duration', 'duration', 'transition-timing', 'ease', 'transition-delay', 'delay'], `<button transition="all" duration="200ms" ease="ease-out" hover-bg="primary/80">...</button>`);
reference('motion-animation.html', 'Animation', 'Map animation attributes to CSS animation properties.', ['animate', 'animation-name', 'animation-duration', 'animation-timing', 'animation-delay', 'animation-iteration', 'animation-direction', 'animation-fill', 'animation-play'], `<span animate="pulse 1.5s ease-in-out infinite">Live</span>`);
reference('media-object.html', 'Object fit', 'Control replaced media such as images and videos.', ['object', 'object-fit', 'object-position', 'object-cover', 'object-contain', 'object-fill', 'object-none', 'object-scale-down'], `<img w="full" aspect="16 / 9" object-cover object-position="center" alt="">`);
reference('media-background.html', 'Background images', 'Control background images and positioning.', ['bg-image', 'bg-size', 'bg-position', 'bg-repeat', 'bg-attachment'], `<section bg-image="url('/hero.jpg')" bg-size="cover" bg-position="center">...</section>`);
reference('interactivity-cursor.html', 'Cursor and pointer', 'Control cursor, pointer events, selection, resize, appearance, touch behavior, and will-change.', ['cursor', 'pointer-events', 'user-select', 'select', 'resize', 'appearance', 'touch', 'will-change'], `<button cursor="pointer" user-select="none" touch="manipulation">Tap</button>`);
reference('interactivity-scroll.html', 'Scroll behavior', 'Control smooth scrolling and snap alignment.', ['scroll-behavior', 'scroll-snap', 'scroll-snap-align'], `<div overflow-x="auto" scroll-snap="x mandatory"><section scroll-snap-align="start">...</section></div>`);

add('html.html', 'HTML', 'Use Atomattr directly in HTML by loading the defaults stylesheet and starting the DOM engine once.', [
  sec('page-setup', 'Page setup', [para('HTML is the canonical Atomattr target. The browser engine scans attributes, generates CSS rules for what it finds, and refreshes when the DOM changes.'), code('index.html', `<!doctype html>
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
</html>`)]),
  sec('component-example', 'Component example', [para('A complete HTML component usually combines layout, spacing, color, typography, radius, border, and state attributes.'), code('pricing-card.html', `<article display="flex" flex-col gap="5" p="6" bg="white" dark-bg="gray-900" rounded="2xl" border="border" shadow="md">
  <div display="flex" items="center" justify="between" gap="3">
    <h2 font-size="2xl" font-weight="bold">Pro</h2>
    <span px="3" py="1" rounded="full" bg="primary/10" text="primary">Popular</span>
  </div>
  <p text="muted" line-height="relaxed">A readable card built without class strings.</p>
  <button px="4" py="2.5" rounded="lg" bg="primary" text="white" hover-bg="primary/80">
    Start trial
  </button>
</article>`)]),
  sec('when-to-refresh', 'Dynamic HTML', [para('When you inject new markup manually, call <code>refreshAtomAttr(container)</code> so Atomattr can scan the new attributes immediately.')]),
]);

add('react.html', 'React', 'Use JSX-friendly props while still emitting the same canonical Atomattr attributes that the HTML engine understands.', [
  sec('aliases', 'JSX aliases', [para('Simple names can be passed directly: <code>bg</code>, <code>p</code>, <code>text</code>, <code>rounded</code>. Dashed HTML names use camel aliases such as <code>fontSize</code>, <code>minH</code>, <code>gridCols</code>, and <code>borderColor</code>.'), code('Card.tsx', `<Box bg="surface" p="6" rounded="xl" border="border">
  <H1 fontSize="3xl" weight="bold">React writes Atomattr</H1>
</Box>`)]),
  sec('full-component', 'Full component', [para('Use the React primitives to keep the component tree expressive while preserving the same styling vocabulary.'), code('PricingCard.tsx', `import { Box, H1, Txt, Btn, Row, Badge } from 'atomattr/react';

export function PricingCard() {
  return (
    <Box bg="surface" p="6" rounded="2xl" border="border" shadow="md">
      <Row items="center" justify="between" gap="3">
        <H1 fontSize="2xl" weight="bold">Pro</H1>
        <Badge bg="primary/10" text="primary">Popular</Badge>
      </Row>
      <Txt mt="4" text="muted" leading="relaxed">
        React props normalize to the same Atomattr attributes.
      </Txt>
      <Btn mt="6" px="4" py="2.5" rounded="lg" bg="primary" text="white">
        Start trial
      </Btn>
    </Box>
  );
}`)]),
  sec('attrs-prop', 'Canonical attrs prop', [para('Use <code>attrs</code> when you want to pass exact Atomattr names from JSX.'), code('Exact.tsx', `<Box attrs={{ 'font-size': '3xl', 'min-h': 'screen', 'hover-bg': 'primary/10' }} />`)]),
]);

add('react-native.html', 'React Native', 'Use Atomattr ideas in React Native with primitives that translate supported attributes into native style objects.', [
  sec('basic-screen', 'Basic screen', [para('React Native does not use browser CSS, so the implementation maps the shared styling vocabulary into native style objects where the platform supports it.'), code('ProfileScreen.tsx', `import { Box, Txt, Btn, Row } from 'atomattr/react-native';

export function ProfileScreen() {
  return (
    <Box flex={1} bg="gray-50" p="6">
      <Box bg="white" rounded="2xl" p="5" shadow="md">
        <Txt fontSize="2xl" weight="bold">Welcome back</Txt>
        <Txt mt="2" text="muted" lineHeight="relaxed">
          Native views, familiar Atomattr-style props.
        </Txt>
        <Row mt="5" gap="3">
          <Btn bg="primary" text="white" px="4" py="2" rounded="lg">
            Continue
          </Btn>
        </Row>
      </Box>
    </Box>
  );
}`)]),
  sec('platform-differences', 'Platform differences', [para('HTML supports selectors like hover and pseudo-elements. React Native does not have the same selector model, so docs should treat native support as platform-aware rather than identical.')]),
  sec('mental-model', 'Same mental model', [para('The goal is consistency: spacing, color, typography, layout, and radius should read similarly across HTML, React, and React Native even when the runtime output is different.')]),
]);

add('react-native-layout.html', 'React Native layout', 'Build native layouts with flex, gap helpers, grid helpers, spacing, and sizing primitives.', [
  sec('flex-layout', 'Flex layout', [para('React Native layout is flexbox-first. Prefer rows, columns, spacing, and alignment props that map naturally to native layout.'), code('Stack.tsx', `import { Box, Row, Txt } from 'atomattr/react-native';

export function StatsRow() {
  return (
    <Row gap="3" items="center" justify="between">
      <Box p="4" rounded="xl" bg="white" flex={1}>
        <Txt text="muted">Revenue</Txt>
        <Txt mt="1" fontSize="2xl" weight="bold">$12k</Txt>
      </Box>
      <Box p="4" rounded="xl" bg="white" flex={1}>
        <Txt text="muted">Orders</Txt>
        <Txt mt="1" fontSize="2xl" weight="bold">340</Txt>
      </Box>
    </Row>
  );
}`)]),
  sec('grid-helper', 'Grid helper', [para('When the native package exposes a grid helper, use it for repeated cells while keeping item styles local.'), code('GridExample.tsx', `import { Grid, Box, Txt } from 'atomattr/react-native';

export function FeatureGrid() {
  return (
    <Grid columns={2} gap="3">
      <Box p="4" rounded="xl" bg="white">
        <Txt weight="bold">Fast</Txt>
      </Box>
      <Box p="4" rounded="xl" bg="white">
        <Txt weight="bold">Readable</Txt>
      </Box>
    </Grid>
  );
}`)]),
]);

add('react-native-inputs.html', 'React Native inputs', 'Style native inputs with the same spacing, color, border, and radius vocabulary where supported.', [
  sec('text-input', 'Text input', [para('Native inputs should clearly expose placeholder, value, change handlers, and the style attributes that translate to native style.'), code('LoginForm.tsx', `import { Box, Input, Btn, Txt } from 'atomattr/react-native';

export function LoginForm() {
  return (
    <Box gap="4" p="6" bg="gray-50">
      <Txt fontSize="2xl" weight="bold">Sign in</Txt>
      <Input
        placeholder="Email"
        bg="white"
        border="1"
        borderColor="gray-200"
        rounded="lg"
        px="4"
        py="3"
      />
      <Btn bg="primary" text="white" rounded="lg" px="4" py="3">
        Continue
      </Btn>
    </Box>
  );
}`)]),
  sec('states', 'Input states', [para('Use explicit component state for native validation and disabled behavior. Unlike the browser, React Native does not automatically expose CSS pseudo-classes such as <code>invalid</code> or <code>focus-visible</code>.')]),
]);

reference('tables-lists.html', 'Tables and lists', 'Style tables, captions, columns, lists, floats, blending, and box sizing.', ['table-layout', 'border-spacing', 'border-collapse', 'border-separate', 'caption', 'list-style', 'list-position', 'columns', 'col-count', 'col-width', 'col-gap', 'box-sizing', 'box-border', 'box-content', 'float', 'clear', 'isolation', 'isolate', 'mix-blend', 'bg-blend'], `<table table-layout="fixed" border-collapse="collapse">...</table>`);
reference('accessibility.html', 'Accessibility', 'Utilities for screen-reader-only content, forced colors, print color adjustment, and accessible focus styling.', ['sr-only', 'not-sr-only', 'print', 'forced-color', 'outline-none'], `<span sr-only>Screen reader label</span>`);

add('tailwind-comparison.html', 'Tailwind comparison', 'A bridge for readers who already know Tailwind and want to understand the equivalent Atomattr shape.', [
  sec('mental-model', 'Mental model', [para('Tailwind puts many utility decisions inside one <code>class</code> string. Atomattr keeps each decision as its own attribute, so scanning an element feels closer to reading named props.'), code('comparison.html', `<!-- Tailwind-style utility classes -->
<article class="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
  <h3 class="mb-2 text-xl font-bold">Card title</h3>
  <p class="text-gray-500">Supporting text</p>
</article>

<!-- Atomattr attributes -->
<article rounded="2xl" border="1px" border-color="gray-200" bg="white" p="6" shadow="md">
  <h3 mb="2" font-size="xl" font-weight="bold">Card title</h3>
  <p text="gray-500">Supporting text</p>
</article>`)]),
  sec('responsive', 'Responsive comparison', [para('Breakpoint prefixes are similar in purpose, but Atomattr puts the breakpoint on the exact property attribute.'), code('responsive-comparison.html', `<!-- Tailwind -->
<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"></div>

<!-- Atomattr -->
<div display="grid" grid-cols="1" gap="4" md-grid-cols="2" lg-grid-cols="4"></div>`)]),
  sec('states', 'State comparison', [para('State prefixes follow the same readable pattern: put the state before the property name.'), code('state-comparison.html', `<!-- Tailwind -->
<button class="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"></button>

<!-- Atomattr -->
<button bg="primary" text="white" hover-bg="primary/80" disabled-opacity="50"></button>`)]),
]);

add('cheatsheet.html', 'Cheatsheet', 'Every registered Atomattr key in one place.', [
  sec('all-attributes', 'All attributes', [attrTable(allKeys)]),
]);

enrichCustomPages();

function reference(file, title, intro, keys, example, scaleValues) {
  add(file, title, intro, [
    sec('when-to-use', 'When to use it', [
      para(`${intro} Use this page when you are deciding which attribute belongs on an element and what kind of value that attribute expects. The examples start small on purpose, then build toward patterns you are likely to repeat in real interfaces.`),
      para('A helpful way to read Atomattr is to scan the element from left to right: layout first, then spacing, then color, then typography, then interaction. You do not have to follow that order perfectly, but keeping related attributes near each other makes a component easier for the next person to understand.'),
      code('basic.html', example),
    ]),
    sec('more-examples', 'More examples', moreExamples(title, keys)),
    sec('attributes', 'Attributes', [attrTable(keys)]),
    ...(scaleValues ? [sec('scale', 'Useful scale values', [scale(title, scaleValues)])] : []),
    sec('tips', 'Reading the syntax', [
      para('Use the base attribute for the default style. Add breakpoint prefixes for layout changes, state prefixes for interaction, and <code>dark-</code> prefixes when a theme needs a different value. This keeps the full behavior of the element visible without sending the reader into a second file.'),
      para('If an attribute maps to a CSS property, the value usually follows that property. When Atomattr has a scale for the property, short tokens such as <code>4</code>, <code>xl</code>, <code>muted</code>, or <code>primary/80</code> make the common cases fast. When a design needs precision, raw CSS values are still valid.'),
      code('combined-pattern.html', combinedExample(title, keys)),
    ]),
  ]);
}

function enrichCustomPages() {
  for (const page of Object.values(pages)) {
    if (!page.sections.length) continue;
    if (page.sections.some(section => section.id === 'practice')) continue;

    page.sections.push(sec('practice', 'Practice patterns', [
      para('The fastest way to learn this page is to copy one example, paste it into the playground, and change one attribute at a time. Keep the structure stable while you experiment with values. Once the result feels right, move the same attributes into your real component.'),
      para('When a component starts to feel noisy, group the attributes mentally by purpose: layout, spacing, color, type, border, effects, and state. Atomattr does not require a special order, but a consistent order makes examples easier to teach and production markup easier to review.'),
      code(`${page.label.toLowerCase().replaceAll(' ', '-')}-practice.html`, practiceExample(page)),
    ]));
  }
}

function practiceExample(page) {
  if (page.file.includes('react-native')) {
    return `import { Box, Txt, Btn } from 'atomattr/react-native';

export function PracticeCard() {
  return (
    <Box bg="white" rounded="2xl" p="5" gap="3">
      <Txt fontSize="xl" weight="bold">${page.label}</Txt>
      <Txt text="muted" lineHeight="relaxed">
        Change spacing, color, and radius values to see the native output.
      </Txt>
      <Btn bg="primary" text="white" rounded="lg" px="4" py="2">
        Try it
      </Btn>
    </Box>
  );
}`;
  }

  if (page.file === 'react.html') {
    return `import { Box, Txt, Btn } from 'atomattr/react';

export function PracticeCard() {
  return (
    <Box bg="surface" rounded="2xl" border="border" p="6">
      <Txt fontSize="xl" weight="bold">${page.label}</Txt>
      <Txt mt="2" text="muted" leading="relaxed">
        Swap values while keeping the component readable.
      </Txt>
      <Btn mt="4" bg="primary" text="white" rounded="lg" px="4" py="2">
        Try it
      </Btn>
    </Box>
  );
}`;
  }

  if (page.file === 'tailwind-comparison.html') {
    return `<article class="rounded-xl border p-5">
  <h3 class="text-lg font-bold">Tailwind source</h3>
</article>

<article rounded="xl" border="1px" p="5">
  <h3 font-size="lg" font-weight="bold">Atomattr version</h3>
</article>`;
  }

  return `<section display="grid" gap="4" p="6" bg="gray-50" dark-bg="gray-950">
  <article bg="white" dark-bg="gray-900" rounded="2xl" border="border" p="5">
    <h3 font-size="xl" font-weight="bold">${page.label}</h3>
    <p mt="2" text="muted" line-height="relaxed">
      Use this as a small playground for the ideas on this page.
    </p>
    <button mt="4" bg="primary" text="white" hover-bg="primary/80" px="4" py="2" rounded="lg">
      Try it
    </button>
  </article>
</section>`;
}

function moreExamples(title, keys) {
  return [
    para('These examples show the same attribute family in practical situations. Copy the closest pattern first, then swap the values for your design system.'),
    code('quick-start.html', quickStartExample(title, keys)),
    code('responsive.html', responsiveExample(title, keys)),
    code('states-and-theme.html', stateExample(title, keys)),
  ];
}

function quickStartExample(title, keys) {
  const key = keys.find(item => !item.startsWith('border-')) || keys[0] || 'bg';
  if (isPresenceOnlyKey(key)) {
    return `<div ${key}>
  ${title} quick start
</div>`;
  }
  if (key.includes('table-layout')) {
    return `<table table-layout="fixed" border-collapse="collapse" w="full">
  <caption text="muted" mb="2">${title} quick start</caption>
</table>`;
  }
  if (key.includes('list-style')) {
    return `<ul list-style="disc" list-position="inside" pl="5">
  <li>${title} item one</li>
  <li>${title} item two</li>
</ul>`;
  }
  if (key.includes('whitespace') || key.includes('text-overflow') || key.includes('truncate')) {
    return `<p max-w="sm" truncate>
  ${title} keeps long copy tidy.
</p>`;
  }
  if (key.includes('position') || key === 'z') {
    return `<div relative>
  <span absolute top="0" right="0" z="10">${title}</span>
</div>`;
  }
  return `<div ${key}="${exampleValueFor(key, 'base')}">
  ${title} quick start
</div>`;
}

function responsiveExample(title, keys) {
  const first = keys[0] || 'p';
  const second = keys[1] || first;
  const firstAttr = attrMarkup(first, 'base');
  const firstResponsive = isPresenceOnlyKey(first) ? `md-${first}` : `md-${first}="${exampleValueFor(first, 'md')}"`;
  if (keys.includes('grid-cols')) {
    return `<section display="grid" grid-cols="1" md-grid-cols="2" xl-grid-cols="4" gap="4">
  <article p="5" rounded="xl" border="border">One</article>
  <article p="5" rounded="xl" border="border">Two</article>
</section>`;
  }
  if (keys.includes('font-size') || keys.includes('text-size')) {
    return `<h1 font-size="3xl" md-font-size="5xl" line-height="tight">
  A headline that scales at larger screens
</h1>`;
  }
  if (keys.includes('bg') || keys.includes('text')) {
    return `<article bg="white" dark-bg="gray-900" text="gray-950" dark-text="white" p="6">
  Theme-aware color values stay on the element.
</article>`;
  }
  return `<div ${firstAttr} ${firstResponsive} ${attrMarkup(second, 'base')}>
  ${title} can change at a breakpoint without moving to a stylesheet.
</div>`;
}

function stateExample(title, keys) {
  const key = keys.find(item => !item.startsWith('border-')) || keys[0] || 'bg';
  if (isPresenceOnlyKey(key)) {
    return `<button ${key}>
  ${title} with hover and dark mode
</button>`;
  }
  if (keys.includes('opacity')) {
    return `<button opacity="100" hover-opacity="90" disabled-opacity="50">
  Submit
</button>`;
  }
  if (keys.includes('shadow')) {
    return `<article shadow="md" hover-shadow="xl" transition="box-shadow" duration="200ms">
  Lift the card on hover.
</article>`;
  }
  if (keys.includes('translate-y') || keys.includes('scale')) {
    return `<button transition="transform" duration="200ms" hover-translate-y="-1" active-scale="95">
  Pressable action
</button>`;
  }
  if (keys.includes('border') || keys.includes('outline')) {
    return `<button border="1px" border-color="gray-200" hover-border-color="primary" focus-visible-outline="2px" outline-color="primary">
  Accessible focus
</button>`;
  }
  return `<button ${key}="${exampleValueFor(key, 'base')}" hover-${key}="${exampleValueFor(key, 'hover')}" dark-${key}="${exampleValueFor(key, 'dark')}">
  ${title} with hover and dark mode
</button>`;
}

function combinedExample(title, keys) {
  const [first = 'p', second = 'bg'] = keys;
  const firstAttr = attrMarkup(first, 'base');
  const secondAttr = attrMarkup(second, 'base');
  const firstResponsive = isPresenceOnlyKey(first) ? `md-${first}` : `md-${first}="${exampleValueFor(first, 'md')}"`;
  const secondHover = isPresenceOnlyKey(second) ? `hover-${second}` : `hover-${second}="${exampleValueFor(second, 'hover')}"`;
  return `<article display="flex" flex-col gap="3" p="5" rounded="xl" border="border" ${firstAttr} ${firstResponsive}>
  <h3 font-size="lg" font-weight="bold">${title} pattern</h3>
  <p text="muted" line-height="relaxed">
    Combine the attribute with layout, spacing, and color so the whole component remains readable.
  </p>
  <button ${secondAttr} ${secondHover} px="4" py="2" rounded="lg">
    Continue
  </button>
</article>`;
}

function attrMarkup(key, mode) {
  if (isPresenceOnlyKey(key)) return key;
  return `${key}="${exampleValueFor(key, mode)}"`;
}

function isPresenceOnlyKey(key) {
  return key === 'sr-only' || key === 'not-sr-only' || key === 'print' || key === 'forced-color' || key === 'outline-none';
}

function exampleValueFor(key, mode) {
  if (!key) return '4';
  if (key.includes('grid-cols')) return mode === 'md' ? '3' : '1';
  if (key.includes('rows')) return '2';
  if (key.includes('gap')) return mode === 'md' ? '6' : '3';
  if (key === 'display') return mode === 'hover' ? 'flex' : 'grid';
  if (key.includes('flex') || key === 'direction') return mode === 'md' ? 'row' : 'column';
  if (key.includes('justify')) return 'between';
  if (key.includes('items') || key.includes('content') || key.includes('self')) return 'center';
  if (key.includes('align')) return 'left';
  if (key.includes('table-layout')) return 'fixed';
  if (key.includes('caption')) return 'bottom';
  if (key.includes('list-style')) return 'disc';
  if (key.includes('list-position')) return 'inside';
  if (key.includes('whitespace') || key.includes('white-space')) return 'nowrap';
  if (key.includes('word-break')) return 'break-word';
  if (key.includes('overflow-wrap')) return 'anywhere';
  if (key.includes('hyphens')) return 'auto';
  if (key.includes('bg') || key.includes('color') || key === 'text' || key === 'fill' || key === 'stroke') {
    if (mode === 'hover') return 'primary/80';
    if (mode === 'dark') return 'gray-900';
    return 'primary';
  }
  if (key.includes('font-size') || key === 'text-size') return mode === 'md' ? '4xl' : '2xl';
  if (key.includes('weight')) return 'bold';
  if (key.includes('line') || key === 'leading') return 'relaxed';
  if (key.includes('rounded') || key === 'radius') return mode === 'md' ? '2xl' : 'lg';
  if (key.includes('shadow')) return mode === 'hover' ? 'xl' : 'md';
  if (key.includes('opacity')) return mode === 'hover' ? '80' : '100';
  if (key.includes('duration')) return '200ms';
  if (key.includes('transition')) return 'all';
  if (key.includes('overflow')) return 'auto';
  if (key === 'position') return 'relative';
  if (key === 'z') return '10';
  if (key.includes('object')) return 'cover';
  if (key.includes('cursor')) return 'pointer';
  if (key.includes('scroll')) return 'smooth';
  return mode === 'md' ? '6' : '4';
}

function sec(id, title, parts) {
  return { id, title, html: parts.join('\n') };
}

function para(html) {
  return `<p font-size="md" text="muted" line-height="relaxed" mb="6" max-w="3xl">${html}</p>`;
}

function code(label, body) {
  const lang = label.endsWith('.tsx') || label.endsWith('.ts') ? 'language-tsx' : label === 'terminal' ? 'language-bash' : 'language-html';
  const escaped = body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<div max-w="4xl" mb="8" bg="grey-100" dark-bg="gray-900" rounded="2xl" overflow="hidden" border="1px" border-color="gray-200" dark-border-color="gray-800">
    <div py="3" px="4" display="flex" justify="between" items="center" border-b="1px" border-color="gray-200" dark-border-color="gray-800">
      <span text="gray-400" font-size="sm">${label}</span><i class="ri-file-code-line" text="gray-500"></i>
    </div>
    <pre px="6" overflow="auto" font-size="sm" line-height="relaxed"><code class="${lang}">${escaped}</code></pre>
  </div>`;
}

function table(head, rows) {
  return `<div overflow-x="auto" max-w="4xl" mb="8"><table w="full" border="1px" border-color="gray-200" dark-border-color="gray-800">
    <thead><tr>${head.map(h => `<th align="left" p="3" bg="gray-100" dark-bg="gray-900">${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(row => `<tr>${row.map(cell => `<td p="3" border-t="1px" border-color="gray-100" dark-border-color="gray-800"><code>${String(cell)}</code></td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}

function attrTable(keys) {
  const rows = keys.filter(key => DICTIONARY[key]).map(key => [key, Array.isArray(DICTIONARY[key]) ? DICTIONARY[key].join(', ') : DICTIONARY[key]]);
  return table(['Attribute', 'CSS output'], rows);
}

function scale(title, values) {
  return `<div mb="8"><h3 font-size="lg" font-weight="bold" mb="3">${title}</h3>${table(['Token', 'Value'], Object.entries(values).slice(0, 96))}</div>`;
}

function cards(items) {
  return `<div display="grid" grid-cols="1" md-grid-cols="3" gap="5" max-w="4xl" mb="8">${items.map(([title, body, href]) => `
    <a href="${href}" text-decoration="none" text="text" bg="#fff" dark-bg="gray-900" border="1px solid gray-100" dark-border-color="gray-800" rounded="2xl" p="5" display="block">
      <h3 font-size="lg" font-weight="bold" mb="2">${title}</h3>
      <p text="muted" line-height="relaxed">${body}</p>
    </a>`).join('')}</div>`;
}

function groupedPages() {
  const groups = [];
  for (const page of Object.values(pages)) {
    let group = groups.find(item => item.title === page.group);
    if (!group) {
      group = { title: page.group, pages: [] };
      groups.push(group);
    }
    group.pages.push(page);
  }
  return groups;
}

function hrefFor(target, current) {
  if (target.file === 'docs.html') return current.file === 'docs.html' ? 'docs.html' : '../docs.html';
  return current.file === 'docs.html' ? `docs/${target.file}` : target.file;
}

function sidebar(current) {
  return groupedPages().map(group => `<div display="flex" flex-col gap="3">
    <h3 text="muted" font-size="xs" font-weight="700" tracking="wide">${group.title.toUpperCase()}</h3>
    <div display="flex" flex-col w="full" border-l="1px" border-color="grey-100" dark-border-color="grey-900">
      ${group.pages.map(page => {
        const active = page.file === current.file;
        return `<a data-doc-page-link py="2" px="3" text="${active ? 'primary' : 'muted'}" ${active ? 'bg="primary/10" font-weight="600"' : 'hover-bg="grey-100" dark-hover-bg="grey-900"'} hover-text="text" w="full" display="flex" text-decoration="none" href="${hrefFor(page, current)}">${page.label}</a>`;
      }).join('\n')}
    </div>
  </div>`).join('\n');
}

function toc(page) {
  return page.sections.map((s, index) => `<a data-toc-link href="#${s.id}" py="1.5" px="3" text="${index === 0 ? 'primary' : 'muted'}" hover-text="text" font-size="sm" font-weight="${index === 0 ? '600' : '400'}" text-decoration="none">${s.title}</a>`).join('\n');
}

function pager(page) {
  const order = pageList.map(([file]) => pages[file]);
  const index = order.findIndex(item => item.file === page.file);
  const previous = order[index - 1];
  const next = order[index + 1];
  const previousCard = previous
    ? pageLinkCard('Previous', previous, page, 'ri-arrow-left-line', false)
    : `<div border="1px" border-color="gray-100" dark-border-color="gray-900" rounded="2xl" py="3" px="5" bg="gray-50" dark-bg="gray-900" flex><strong>Start here</strong></div>`;
  const nextCard = next
    ? pageLinkCard('Next', next, page, 'ri-arrow-right-line', true)
    : `<a href="../playground.html" text-decoration="none" text="text" border="1px" border-color="gray-100" dark-border-color="gray-900" rounded="lg" py="3" px="5" bg="gray-50" dark-bg="gray-900" flex hover-bg="primary/10" display="block" max-w="fit">
        <p text="primary" font-size="sm" font-weight="700" mb="2">What's next</p>
        <div display="flex" items="center" justify="center" gap="4">
          <strong>Open the playground</strong>
          <i class="ri-arrow-right-line"></i>
        </div>
      </a>`;

  return `<nav aria-label="Documentation pagination" display="flex" items="center" justify="between" gap="4" max-w="4xl" py="10" border-t="1px" border-color="gray-100" dark-border-color="gray-900">
    ${previousCard}
    ${nextCard}
  </nav>`;
}

function pageLinkCard(label, target, current, icon, iconAfter) {
  const href = hrefFor(target, current);
  return `<a href="${href}" text-decoration="none" text="text" border="1px" border-color="gray-100" dark-border-color="gray-900" rounded="lg" py="3" px="5" bg="gray-50" dark-bg="gray-900" flex hover-bg="primary/10" display="block" max-w="fit">
    <p text="muted" font-size="sm" mb="2">${label}</p>
    <div display="flex" items="center" justify="center" gap="4">
      ${iconAfter ? '' : `<i class="${icon}"></i>`}
      <strong>${target.label}</strong>
      ${iconAfter ? `<i class="${icon}"></i>` : ''}
    </div>
    <p text="muted" font-size="sm" line-height="relaxed" mt="2">${target.group}</p>
  </a>`;
}

function stripHtml(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function searchDataScript(page) {
  if (page.file !== 'search.html') return '';

  const records = Object.values(pages).flatMap(target => {
    const pageHref = hrefFor(target, page);
    return [
      {
        type: 'page',
        label: target.title,
        detail: `${target.group} - ${target.intro}`,
        href: pageHref,
      },
      ...target.sections.map(section => ({
        type: 'section',
        label: `${target.title}: ${section.title}`,
        detail: stripHtml(section.html).slice(0, 360),
        href: `${pageHref}#${section.id}`,
      })),
    ];
  });

  return `<script>window.ATOMATTR_DOCS_SEARCH_PAGES=${JSON.stringify(records).replace(/</g, '\\u003c')};</script>`;
}

function render(page) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title} - Atomattr Docs</title>
  <meta name="description" content="${page.intro.replace(/"/g, '&quot;')}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link id="hljs-light" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/foundation.min.css" media="(prefers-color-scheme: light)">
  <link id="hljs-dark" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/monokai-sublime.min.css" media="(prefers-color-scheme: dark)">
  <style>html{font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans","Inter",sans-serif}h1,h2,h3{font-family:'Space Grotesk',sans-serif;letter-spacing:0}code,pre,pre code{font-family:'JetBrains Mono',monospace}pre code.hljs{background:transparent!important;padding:0!important}table{border-collapse:collapse}section{scroll-margin-top:120px}</style>
  <link rel="stylesheet" href="/dist/defaults.css">
  <link rel="stylesheet" href="/assets/remixicon/remixicon.css">
  <link rel="stylesheet" href="/assets/showcase.css">
</head>
<body bg="#fff" dark-bg="grey-950" text="text" min-h="screen">
  <header data-site-nav position="sticky" top="0" z="100" bg="#fff" dark-bg="gray-950" border-b="1px" border-color="gray-100" dark-border-color="gray-900" backdrop-blur="md"></header>
  <div display="flex" md-display="none" items="center" justify="between" px="4" py="3" bg="#fff" dark-bg="grey-950" border-b="1px" border-color="gray-100" dark-border-color="gray-900" position="sticky" top="68px" z="40">
    <button type="button" aria-label="Open contents" aria-expanded="false" data-mobile-toggle="docs-sidebar" display="flex" items="center" gap="2" bg="grey-100" dark-bg="gray-900" text="text" border="border" px="3" py="2" rounded="lg" font-size="sm" font-weight="600"><i class="ri-menu-2-line" font-size="16" data-mobile-toggle-icon></i>Contents</button>
    <span text="muted" font-size="sm" font-weight="500">${page.label}</span>
  </div>
  <main class="page-shell">
    <div class="docs-layout" display="flex" items="start">
      <aside id="docs-sidebar" class="sidebar" p="5" w="86vw" sm-w="62vw" md-w="20dvw" display="none" md-display="block" fixed bg="#fff" dark-bg="grey-950" border-r="1px" border-color="grey-100" dark-border-color="grey-900" top="0" left="0" h="100dvh" pt="24" pb="8" z="45" overflow-y="auto">
        <div w="full" display="flex" flex-col gap="6">${sidebar(page)}</div>
      </aside>
      <div px="4" md-pl="calc(20dvw + 2rem)" lg-pr="calc(20dvw + 1rem)" pt="8" md-pt="12" w="full" max-w="100dvw">
        <div max-w="3xl">
          <p text="primary" font-size="sm" font-weight="bold" tracking="wide" mb="3">${page.group.toUpperCase()}</p>
          <h1 font-size="2xl" md-font-size="4xl" font-weight="bold" tracking="tight" mb="4">${page.title}</h1>
          <p font-size="md" text="muted" line-height="relaxed" mb="10">${page.intro}</p>
        </div>
        ${page.sections.map(s => `<section id="${s.id}" pt="4" pb="16" border-t="1px" border-color="gray-100" dark-border-color="gray-900"><h2 font-size="xl" md-font-size="2xl" font-weight="bold" tracking="tight" mb="4" pt="10">${s.title}</h2>${s.html}</section>`).join('\n')}
        ${pager(page)}
      </div>
      <aside display="none" lg-display="block" fixed top="0" right="0" w="20dvw" min-h="100dvh" pt="24" pr="6" pl="4" z="30">
        <div position="sticky" top="24"><h3 text="muted" font-size="xs" font-weight="700" tracking="wide" mb="3">ON THIS PAGE</h3><div display="flex" flex-col gap="1" border-l="1px" border-color="grey-100" dark-border-color="grey-900">${toc(page)}</div></div>
      </aside>
    </div>
  </main>
  ${searchDataScript(page)}
  <script src="/dist/atomattr.min.js" defer></script>
  <script type="module" src="/site/app.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script>hljs.highlightAll();</script>
</body>
</html>`;
}

mkdirSync(DOCS_DIR, { recursive: true });
for (const file of readdirSync('.')) {
  if (/^docs-.+\.html$/.test(file)) unlinkSync(file);
}
for (const file of readdirSync(DOCS_DIR)) {
  if (file.endsWith('.html')) unlinkSync(join(DOCS_DIR, file));
}
for (const page of Object.values(pages)) {
  const target = page.file === 'docs.html' ? 'docs.html' : join(DOCS_DIR, page.file);
  writeFileSync(target, render(page));
}
