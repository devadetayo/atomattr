import { mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DICTIONARY } from '../src/style-data/dictionary.js';
import {
  BREAKPOINTS,
  CONTAINER_BREAKPOINTS,
  PSEUDO_STATES,
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
  ['modern-css.html', 'Modern CSS', 'Getting Started'],
  ['container-queries.html', 'Container Queries', 'Modern CSS'],
  ['anchor-positioning.html', 'Anchor Positioning', 'Modern CSS'],
  ['scroll-driven-animations.html', 'Scroll-driven Animations', 'Modern CSS'],
  ['view-transitions.html', 'View Transitions', 'Modern CSS'],
  ['selectors.html', 'Selectors and States', 'Modern CSS'],
  ['performance.html', 'Runtime and Performance', 'Reference'],
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

add('docs.html', 'Getting started with Atomattr', 'A practical first walkthrough: install the engine, style a component, and learn where to look when an attribute does not work.', [
  sec('model', 'The model', [
    para('Atomattr turns recognized attributes into CSS declarations. The attribute name chooses the CSS property (for example, <code>p</code> means padding); its value chooses the token or CSS value (for example, <code>6</code> resolves through the spacing scale). The engine runs in the browser, scans the page, and creates rules for the attributes it recognizes.'),
    code('card.html', `<article bg="surface" p="6" rounded="xl" border="border">
  <h3 font-size="xl" font-weight="bold" mb="2">Profile card</h3>
  <p text="muted">The markup carries the styling contract.</p>
</article>`),
    para('The example sets the card background, inner spacing, corners, and border on the <code>&lt;article&gt;</code>. The heading has its own size and weight, while <code>mb="2"</code> adds space below it. The paragraph uses the semantic <code>muted</code> text color. The HTML element still provides meaning; Atomattr only supplies styling.'),
    para('To see it in a project, load <code>defaults.css</code> and the browser engine once. Then add one visible attribute such as <code>p="6"</code> to an element. If that works, layer on colors, layout, and modifiers one step at a time.'),
  ]),
  sec('first-component', 'Build a small component', [
    para('This profile card combines several independent choices. Read each line by asking: which element is being styled, which CSS property does the attribute name select, and what value should that property receive?'),
    code('profile-card.html', `<article display="flex" flex-col gap="4" max-w="sm" p="6"
  bg="white" dark-bg="gray-900" rounded="2xl" border="border">
  <div display="flex" items="center" gap="3">
    <img src="avatar.jpg" alt="Portrait of Ada" w="12" h="12" rounded="full" object="cover">
    <div>
      <h2 font-size="lg" font-weight="bold">Ada Okafor</h2>
      <p text="muted">Product designer</p>
    </div>
  </div>
  <p line-height="relaxed">I turn complex workflows into clear, useful products.</p>
  <button type="button" px="4" py="2" bg="primary" text="white"
    rounded="lg" hover-bg="primary/80" focus-visible-outline="2px">
    View profile
  </button>
</article>`),
    para('Here <code>display="flex"</code> creates a flex layout and <code>flex-col</code> stacks its children vertically. <code>gap="4"</code> spaces each direct child. The <code>dark-</code> and <code>hover-</code> prefixes apply only in their matching contexts; they do not replace the base styles. The image alt text and button type remain ordinary HTML behavior.'),
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
  sec('atomattr-ui', 'Browse AtomAttr UI', [
    para('AtomAttr UI is the free copy-and-paste library for complete components, page sections, and templates. Preview a pattern, inspect the HTML, and adapt it in your project without installing a component package.'),
    cards([
      ['Browse UI patterns', 'Find buttons, forms, navigation, footers, sections, and page templates.', 'ui.html'],
      ['Start with attributes', 'See the supported styling syntax and responsive variants.', 'docs/syntax.html'],
      ['Search the reference', 'Look up an attribute or CSS property by name.', 'docs/search.html'],
    ]),
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

add('installation.html', 'Installation', 'Install Atomattr, load the base stylesheet, start the browser engine, and confirm the first style is working.', [
  sec('package', 'Install the package', [para('From your app directory, install Atomattr. This adds the browser engine and its default design tokens to your project; it does not add a component library.'), code('terminal', 'npm install atomattr'), para('If you are using React, make sure <code>react</code> and <code>react-dom</code> are installed too. For plain static HTML, use the pinned CDN option below or build the library files in this repository.')]),
  sec('plain-html', 'Plain HTML', [para('For a local project build, run <code>npm run build:library</code> and serve the generated <code>dist</code> files from your site. The stylesheet defines defaults and tokens; the browser bundle scans Atomattr attributes and generates their rules.'), code('index.html', `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <link rel="stylesheet" href="/dist/defaults.css">
  </head>
  <body>
    <main p="6">
      <h1 font-size="3xl" text="primary">It works</h1>
      <button bg="primary" text="white" px="4" py="2" rounded="lg">Continue</button>
    </main>
    <script src="/dist/atomattr.min.js" defer></script>
  </body>
</html>`), para('For a standalone page without a local build, load both files from the same pinned package version. Avoid mixing a stylesheet from one version with a runtime from another.'), code('CDN links', `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/atomattr@1.0.1/dist/defaults.css">
<script src="https://cdn.jsdelivr.net/npm/atomattr@1.0.1/dist/atomattr.min.js" defer></script>`)]),
  sec('vite', 'Vite and other JavaScript apps', [para('Import the stylesheet and engine from your client entry point. Start the engine after importing it; the call is safe if another browser-side import has already started it.'), code('src/main.js', `import 'atomattr/defaults.css';
import { startAtomAttr } from 'atomattr';

startAtomAttr();`), para('The browser engine observes added markup. If code changes attributes and needs their rules synchronously, use <code>refreshAtomAttr(element)</code> after the change. See the [runtime guide](performance.html) for details.')]),
  sec('react', 'React', [para('Import <code>defaults.css</code> once in the app entry. React primitives translate JSX-friendly props into the canonical dashed HTML attributes. Importing <code>atomattr/react</code> starts the browser engine, so an explicit start call is optional.'), code('src/App.tsx', `import 'atomattr/defaults.css';
import { Box, H1, Txt, Btn } from 'atomattr/react';

export function App() {
  return (
    <Box bg="surface" p="6" rounded="xl" border="border">
      <H1 fontSize="2xl" fontWeight="bold">Welcome</H1>
      <Txt text="muted">Your first Atomattr component.</Txt>
      <Btn mt="4" bg="primary" hoverBg="primary/80">Continue</Btn>
    </Box>
  );
}`), para('Use camel-case aliases such as <code>fontSize</code> when JSX does not accept a dashed prop as expected. The React guide lists aliases and the <code>attrs</code> escape hatch.')]),
  sec('verify', 'Check that it is working', [para('Use this short check before adding more styles:'), `<ol><li>Confirm the defaults stylesheet and runtime return successfully in the browser network panel.</li><li>Put <code>p="6" bg="primary" text="white"</code> on a visible element.</li><li>Inspect the element and confirm the generated CSS rule is present.</li><li>If nothing changes, check the spelling against the <a href="cheatsheet.html">cheatsheet</a> and confirm the runtime loaded after the page markup.</li></ol>`, para('Unrecognized styling attributes are ignored, so a typo can look like a setup problem. The [syntax guide](syntax.html) explains recognized names and modifiers.')]),
]);

add('syntax.html', 'Syntax', 'The Atomattr syntax is one consistent shape: a registered property attribute, zero or more supported modifier prefixes, and a CSS or token value.', [
  sec('base', 'Base attributes', [para('A base attribute applies at every viewport size and state. The name selects the declaration and the value supplies its setting. For example, <code>px</code> is horizontal padding, so <code>px="4"</code> applies the spacing scale value on both inline sides.'), code('base.html', `<button px="4" py="2" bg="primary" text="white" rounded="lg">
  Save
</button>`), para('This produces separate CSS declarations for padding, background, text color, and corner radius. It does not add a class to the element. You can put multiple recognized attributes on the same element because each one controls a separate property.')]),
  sec('prefixes', 'Prefixes', [para('A modifier is added before the property name and ends at the next hyphen. <code>md-p</code> means the padding rule applies at the medium viewport breakpoint; <code>hover-bg</code> means the background rule applies while the element is hovered. Common modifier families include viewport breakpoints, states, dark theme, group states, container sizes, and pseudo-elements.'), code('prefixes.html', `<article p="4" md-p="8" bg="white" dark-bg="gray-900" hover-shadow="lg">
  The styling changes by breakpoint, theme, and state.
</article>`), para('In this example, the base padding is used first. At the medium breakpoint, only padding changes to <code>8</code>; background and shadow are unaffected. In dark mode, the background changes. On hover, the shadow changes. Prefixes do not add behavior such as toggling a theme or opening a menu; they only select when a CSS rule applies.'),
    para('Supported prefixes can be combined, for example <code>md-dark-hover-bg</code>. Use the documented order from the relevant page, and check the selector reference when combining multiple conditions. Unknown names or modifier combinations do not generate a rule.'),
  ]),
  sec('canonical', 'Canonical names and limits', [para('HTML attribute names are the source of truth. Use dashed names such as <code>font-size</code>, <code>min-h</code>, <code>grid-cols</code>, and <code>border-color</code>. React can provide aliases, but it normalizes back to these names. Unknown attributes are ignored. Arbitrary property names and selector strings are not accepted.'), cards([
    ['Variants', 'Supported states and selector composition.', 'docs/selectors.html'],
    ['Container queries', 'Responsive styles based on a parent container.', 'docs/container-queries.html'],
    ['Values', 'Tokens and CSS values passed to the browser.', 'docs/values.html'],
  ])]),
]);

add('values.html', 'Values', 'Values can be scale tokens, semantic tokens, raw CSS values, or CSS functions depending on the property.', [
  sec('scale-values', 'Scale values', [para('A short value is interpreted using the scale for that attribute. The same value can mean different things for different properties: <code>p="4"</code> is a spacing step, <code>font-size="4"</code> is a font-size value if supported by that scale, and <code>rounded="4"</code> refers to a radius. Check the relevant reference table instead of assuming one universal scale.'), code('tokens.html', `<div p="6" rounded="xl" shadow="md">
  <h2 font-size="2xl" font-weight="bold">A token-based card</h2>
  <p text="muted">Scale names keep common choices consistent.</p>
</div>`), para('In the example, <code>p</code>, <code>rounded</code>, and <code>shadow</code> each resolve through their own token set. Semantic color names such as <code>primary</code>, <code>surface</code>, and <code>muted</code> describe a role in the interface, which can make theme changes easier.'), scale('Spacing scale', SPACING_SCALE)]),
  sec('raw-values', 'Raw values', [para('When you need precision, use regular CSS values such as <code>42px</code>, <code>12rem</code>, <code>calc(100vh - 4rem)</code>, or <code>linear-gradient(...)</code>.'), code('raw-values.html', `<section min-h="calc(100vh - 64px)" bg-gradient="linear-gradient(135deg, #0f172a, #2563eb)">
  Exact CSS values still work.
</section>`)]),
  sec('opacity-suffixes', 'Opacity suffixes', [para('Color-like attributes accept a slash followed by an opacity percentage. This is useful for subtle surfaces and overlays: <code>primary/10</code> is a lightly tinted background, while <code>white/80</code> is partially transparent white text.'), code('alpha.html', `<div bg="primary/10" p="4" rounded="lg">
  <p text="gray-950">Tinted surface</p>
  <span bg="gray-950" text="white/80">Muted label</span>
</div>`), para('Opacity suffixes are color syntax, not a universal modifier. For an entire element, use an opacity attribute. For a color with exact alpha, a CSS color function such as <code>rgb(20 30 40 / 25%)</code> is also a valid choice.')]),
]);

add('modern-css.html', 'Modern CSS capabilities', 'Use Atomattr attributes for modern CSS declarations, and keep in mind that browser support follows the CSS feature rather than the framework.', [
  sec('container-queries', 'Container queries', [
    para('Mark a parent with <code>container-type="inline-size"</code> or <code>container="card / inline-size"</code>. Descendant attributes prefixed with <code>cq-sm-</code>, <code>cq-md-</code>, <code>cq-lg-</code>, or <code>cq-xl-</code> generate an <code>@container (min-width: ...)</code> rule for the nearest eligible container.'),
    code('container-query.html', `<article container="card / inline-size" p="4" border="border">
  <div display="grid" grid-cols="1" cq-md-grid-cols="2" gap="4">
    <img object-fit="cover" aspect="video" src="cover.jpg" alt="">
    <div><h2 text-wrap="balance">A card that responds to its own width</h2></div>
  </div>
</article>`),
    para('The parent declaration is required. A container query cannot style the container itself; it applies to descendants. Container size query variants are a convenience for min-width conditions. Use ordinary attributes for full CSS property values and query features.'),
  ]),
  sec('modern-properties', 'Modern property coverage', [
    para('The dictionary includes CSS properties for logical sizing and insets, text wrapping and clamping, containment, field sizing, scroll and view timelines, anchor positioning, masks and clipping, and View Transitions. Values are passed to CSS as written, so unsupported values are ignored by the browser.'),
    attrTable(Object.keys(DICTIONARY).filter(key => /^(container|anchor-|position-anchor|position-area|position-try|view-transition|animation-timeline|animation-range|scroll-timeline|view-timeline|content-visibility|contain|field-sizing|interpolate-size|text-wrap|line-clamp|scrollbar-|clip-path|shape-outside|mask-)/.test(key))),
  ]),
  sec('browser-support', 'Browser support', [
    para('Container queries, text wrapping, and containment are broadly usable in current browsers. Anchor positioning, scroll-driven animation timelines, <code>field-sizing</code>, and intrinsic-size interpolation have more varied support. Check your browser support targets before relying on them, and provide a fallback where needed.'),
  ]),
  sec('focused-guides', 'Focused guides', [
    cards([
      ['Container Queries', 'Set up a query container and use the supported size variants.', 'docs/container-queries.html'],
      ['Anchor Positioning', 'Style anchor relationships using native CSS properties.', 'docs/anchor-positioning.html'],
      ['Scroll-driven Animations', 'Connect CSS animations to scroll and view timelines.', 'docs/scroll-driven-animations.html'],
      ['View Transitions', 'Name and style elements participating in a view transition.', 'docs/view-transitions.html'],
      ['Selectors and States', 'See the selector variants currently supported by the parser.', 'docs/selectors.html'],
      ['Runtime and Performance', 'Understand rule generation, mutation handling, and limits.', 'docs/performance.html'],
    ]),
  ]),
]);

add('container-queries.html', 'Container queries', 'Use container queries when a component should respond to the space available in its parent rather than the viewport.', [
  sec('declare', 'Declare a query container', [
    para('AtomAttr maps the <code>container</code>, <code>container-name</code>, and <code>container-type</code> attributes directly to CSS. A size query needs an eligible ancestor; <code>inline-size</code> is the usual choice for cards and panels.'),
    code('container.html', `<section container="card / inline-size" p="4" border="border">
  <article display="grid" grid-cols="1" cq-md-grid-cols="2" gap="4">
    <img src="cover.jpg" alt="" aspect="video" object-fit="cover">
    <div><h2 text-wrap="balance">A component that follows its parent width</h2></div>
  </article>
</section>`),
  ]),
  sec('variants', 'Supported size variants', [
    table(['Prefix', 'Generated condition'], Object.entries({ 'cq-sm': 'min-width: 640px', 'cq-md': 'min-width: 768px', 'cq-lg': 'min-width: 1024px', 'cq-xl': 'min-width: 1280px' })),
    para('These modifiers wrap the generated declaration in <code>@container (min-width: ...)</code>. They compose with viewport prefixes and supported pseudo states, for example <code>md-cq-md-hover-bg="primary/10"</code>. They target the nearest eligible size container and currently express min-width conditions only.'),
    para('The current API does not parse arbitrary query expressions, named-container selectors, style queries, or scroll-state queries. For those cases, write an ordinary CSS rule until AtomAttr exposes a structured query API.'),
  ]),
  sec('limits', 'Container query details', [
    para('A query container cannot style itself with its own query. Put the responsive attribute on a descendant. Container query units such as <code>cqw</code> and <code>cqi</code> can be used in raw property values when the browser supports them.'),
  ]),
]);

add('anchor-positioning.html', 'Anchor positioning', 'Use CSS anchor positioning properties through normal AtomAttr attributes to connect floating UI to an anchor element.', [
  sec('primitives', 'Anchor primitives', [
    para('The engine exposes <code>anchor-name</code>, <code>anchor-scope</code>, <code>position-anchor</code>, <code>position-area</code>, <code>position-try</code>, and <code>position-try-fallbacks</code> as direct CSS properties. Use the same dashed identifiers on the anchor and positioned element.'),
    code('tooltip.html', `<button anchor-name="--help-anchor" aria-describedby="help-tip">Help</button>
<div id="help-tip" position="fixed" position-anchor="--help-anchor" position-area="block-end" position-try-fallbacks="flip-block" p="3" rounded="lg" bg="gray-950" text="white">
  Contextual help tied to its trigger
</div>`),
    para('The example shows CSS styling only. It does not add tooltip visibility, keyboard dismissal, focus management, or ARIA behavior. A real tooltip or popover still needs correct interactive semantics and behavior.'),
  ]),
  sec('functions', 'Anchor functions', [
    para('CSS values may include <code>anchor()</code> and <code>anchor-size()</code>, for example <code>top="anchor(bottom)"</code> or <code>width="anchor-size(width)"</code>. AtomAttr passes these values through to CSS; browser support and valid positioning context are required.'),
  ]),
  sec('fallbacks', 'Fallbacks and limits', [
    para('Provide a usable non-anchored layout for browsers that do not support the feature. AtomAttr emits declarations, but it does not define custom <code>@position-try</code> at-rules or reposition elements with JavaScript.'),
  ]),
]);

add('scroll-driven-animations.html', 'Scroll-driven animations', 'Use CSS animation timeline properties to link an animation to scroll progress or an element passing through a scrollport.', [
  sec('timeline-properties', 'Timeline properties', [
    para('AtomAttr provides declaration attributes for <code>scroll-timeline</code>, <code>view-timeline</code>, <code>animation-timeline</code>, and animation range properties. CSS animation keyframes must be defined in a stylesheet; AtomAttr does not create <code>@keyframes</code> blocks.'),
    code('scroll-progress.html', `<div scroll-timeline="--page-progress block" overflow-y="auto">
  <div animation-name="grow" animation-duration="1s" animation-timing="linear" animation-fill="both" animation-timeline="scroll(--page-progress)" animation-range="0% 100%">Progress indicator</div>
</div>`),
    para('For a view timeline, name the subject with <code>view-timeline-name="--reveal"</code>, then reference it from a descendant using <code>animation-timeline="--reveal"</code>. Define the animation name and keyframes in regular CSS.'),
  ]),
  sec('accessibility', 'Motion preferences and support', [
    para('Scroll-linked effects can cause discomfort or hide content. Keep the underlying content visible and add a reduced-motion fallback in your stylesheet, such as a <code>prefers-reduced-motion</code> media rule. Support for timeline features varies by browser; check your target browser matrix.'),
  ]),
]);

add('view-transitions.html', 'View Transitions', 'Style named snapshots for browser View Transitions without adding routing or transition orchestration to AtomAttr.', [
  sec('name-snapshots', 'Name participating elements', [
    para('Set <code>view-transition-name</code> on elements that should receive their own snapshot. Names must be unique among simultaneously rendered participants. AtomAttr provides the CSS property and leaves transition initiation to the browser navigation or application code.'),
    code('view-transition-name.html', `<article view-transition-name="product-card" bg="white" dark-bg="gray-900" rounded="xl" p="5">
  <h2>Product details</h2>
</article>`),
  ]),
  sec('pseudo-elements', 'Style transition snapshots', [
    para('View Transition snapshots use special pseudo-elements such as <code>::view-transition-old()</code> and <code>::view-transition-new()</code>. The current AtomAttr attribute parser targets attributes on elements and supports only its built-in <code>before</code> and <code>after</code> pseudo-element prefixes; use a stylesheet for transition pseudo-element selectors and the <code>@view-transition</code> at-rule.'),
  ]),
  sec('fallbacks', 'Progressive enhancement', [
    para('Treat these styles as progressive enhancement. Keep navigation and content updates functional without transitions, and respect reduced-motion preferences in the CSS that starts or styles a transition.'),
  ]),
]);

add('selectors.html', 'Selectors and states', 'AtomAttr variants generate selectors from a constrained, readable prefix grammar.', [
  sec('states', 'Supported pseudo-class prefixes', [
    para('Supported state prefixes include hover, focus, focus-visible, focus-within, active, visited, disabled, checked, indeterminate, required, optional, valid, invalid, read-only, read-write, placeholder-shown, open, selected, empty, first, last, odd, even, first-of-type, and last-of-type. Prefixes compose with viewport and dark variants.'),
    code('state-selectors.html', `<button hover-bg="primary/90" focus-visible-outline="2px" focus-visible-outline-color="primary" active-scale="0.98" disabled-opacity="50">Save</button>
<li odd-bg="gray-50" even-bg="white">Activity item</li>
<input required invalid-border-color="red-600" placeholder-shown-text="gray-500">`),
  ]),
  sec('composition', 'Composition rules', [
    para('Prefixes are separated by hyphens and resolved against registered names, so longer prefixes such as <code>focus-visible</code> are recognized as one modifier. Examples include <code>md-hover-bg</code>, <code>dark-focus-visible-outline</code>, and <code>md-cq-lg-hover-bg</code>.'),
  ]),
  sec('unsupported-selectors', 'Selector features not exposed yet', [
    para('Arbitrary <code>:has()</code>, <code>:is()</code>, <code>:where()</code>, <code>:not()</code>, descendant or sibling combinators, and custom selector strings are not supported by the attribute parser. Use regular CSS for these selectors. This avoids claiming a selector syntax that the engine cannot safely parse or generate.'),
  ]),
]);

add('performance.html', 'Runtime and performance', 'Understand how the browser engine scans AtomAttr attributes, deduplicates rules, and reacts to DOM changes.', [
  sec('rule-generation', 'Rule generation', [
    para('The browser engine scans supported attributes and inserts generated rules into its stylesheet. It keeps a rule cache to avoid inserting an identical attribute/value rule more than once. A change to an attribute can add a new rule; previously generated rules are not automatically removed when attributes disappear.'),
    para('The cache is currently session-local and stylesheet rule order follows discovery order. Do not rely on AtomAttr to implement Tailwind-style conflict sorting or CSS cascade layers.'),
  ]),
  sec('dom-updates', 'Dynamic DOM updates', [
    para('Initial scanning processes the document tree. MutationObserver work groups changed elements and newly added subtrees into a scheduled batch; call <code>refreshAtomAttr(container)</code> after framework or third-party changes only when automatic observation is unavailable or immediate processing is required.'),
  ]),
  sec('limits', 'Performance limits', [
    para('The project does not yet publish measured startup, memory, CSS size, or 100-to-10,000 element benchmarks. Keep repeated generated values consistent, avoid unnecessary attribute churn, and benchmark in the browser and app shapes you ship.'),
  ]),
]);

add('responsive.html', 'Responsive attributes', 'Use breakpoint prefixes to change a value from a viewport width upward.', [
  sec('breakpoints', 'Breakpoints', [para('A breakpoint prefix wraps the declaration in a minimum-width media query. The unprefixed attribute still applies below that threshold. These are minimum widths, so a value introduced at <code>md</code> continues at larger sizes until another declaration overrides it.'), table(['Prefix', 'Minimum width'], Object.entries(BREAKPOINTS))]),
  sec('mobile-first', 'Mobile first', [para('Start with the narrow-screen layout, then add only the changes needed on wider screens. This is easier to maintain than repeating every attribute at every breakpoint.'), code('responsive-grid.html', `<div display="grid" grid-cols="1" sm-grid-cols="2" lg-grid-cols="4" gap="4">
  <article p="5" rounded="xl" border="border">One</article>
  <article p="5" rounded="xl" border="border">Two</article>
  <article p="5" rounded="xl" border="border">Three</article>
  <article p="5" rounded="xl" border="border">Four</article>
</div>`)]),
  sec('overrides', 'Overriding values', [para('At the smallest width, the grid has one column; from <code>sm</code> it has two, and from <code>lg</code> it has four. The gap stays at <code>4</code> at every width because it has no prefix. A breakpoint rule changes only the property named by that attribute.'), code('responsive-card.html', `<article p="4" md-p="6" display="flex" flex-col md-flex-row gap="4">
  <img src="cover.jpg" alt="" w="full" md-w="40" aspect="video" object="cover">
  <div grow="1">
    <h2 font-size="lg" md-font-size="2xl">A responsive card</h2>
    <p text="muted">Padding, direction, image width, and type shift at md.</p>
  </div>
</article>`), para('Use [container queries](container-queries.html) when the component should respond to the width of its parent rather than the browser window. A card in a narrow sidebar may need a one-column layout even on a large desktop screen.')]),
]);

add('states.html', 'State attributes', 'State prefixes map to supported CSS pseudo-classes for interaction, form validation, and child position.', [
  sec('interactive', 'Interactive states', [para('State prefixes add a CSS pseudo-class condition to one declaration. Use them for feedback when a user hovers, focuses, or disables a control. Keep a clear base style so the control remains understandable before interaction.'), code('button-states.html', `<button type="button" bg="primary" text="white" px="4" py="2" rounded="lg"
  hover-bg="primary/80" focus-visible-outline="2px"
  focus-visible-outline-color="primary" disabled-opacity="50">
  Continue
</button>`), para('The button keeps its primary background by default, becomes slightly more transparent on hover, and receives a visible outline when keyboard focus is visible. When the native <code>disabled</code> state is present, the opacity rule applies. State styling does not implement the control action or set the disabled attribute for you.')]),
  sec('structural', 'Structural states', [para('Use <code>first</code>, <code>last</code>, <code>odd</code>, and <code>even</code> when repeated elements need alternating or edge styling.'), code('rows.html', `<li odd-bg="gray-50" even-bg="white" first-rounded-t="lg" last-rounded-b="lg">
  Row item
</li>`)]),
  sec('forms', 'Form states', [para('Form-state variants style browser states; the input type and attributes determine when those states are true. For example, an email input becomes invalid when it has a value that fails email validation, while <code>required</code> makes an empty value invalid on submission.'), code('validation.html', `<label for="email" display="flex" flex-col gap="2">
  Work email
  <input id="email" type="email" required placeholder="you@example.com"
    p="3" border="1px solid gray-300" rounded="lg"
    invalid-border-color="red-600" valid-border-color="emerald-600">
</label>`), para('The example changes the border according to native constraint validation. Add a visible text message in your application when users need an explanation; color alone should not be the only error signal. The <code>selected</code> prefix currently maps to <code>:checked</code>; for a selected <code>&lt;option&gt;</code>, style the option or use application logic.')]),
]);

add('dark-mode.html', 'Dark mode', 'The dark prefix scopes a rule under the dark theme class on the document.', [
  sec('basic', 'Basic dark mode', [para('A <code>dark-</code> attribute is an alternate value for the same property. The generated rule applies when the root HTML element has the <code>dark</code> class, so include a readable base value as well.'), code('dark-card.html', `<article bg="white" text="gray-950" dark-bg="gray-900" dark-text="white" border="border" dark-border-color="gray-700">
  Theme-aware content
</article>`), para('When the root class is absent, the card uses a white background and dark text. When the class is present, it uses a dark surface, light text, and a subtler border. The prefix does not detect the operating system or add a theme switch by itself.')]),
  sec('strategy', 'Switch and test themes', [para('Add or remove the class on the root element from your theme control. A system preference can be used to choose the initial state, but the toggle and saved preference are application behavior.'), code('theme.js', `const root = document.documentElement;
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

root.classList.toggle('dark', prefersDark);

// A user-controlled switch can update it later:
root.classList.toggle('dark', userChoseDark);`), para('Test both themes for text contrast, borders, focus rings, images, and disabled controls. Semantic tokens such as <code>surface</code>, <code>text</code>, and <code>muted</code> can reduce the need for explicit dark variants when their definitions already fit your design.')]),
]);

add('pseudo-elements.html', 'Pseudo elements', 'Use before and after prefixes for generated decoration or helper marks without adding extra markup.', [
  sec('before-after', 'Before and after', [para('Pseudo-element attributes are best for small visual marks. Remember that generated pseudo-elements usually need <code>content</code>.'), code('marker.html', `<span relative pl="4" before-content="''" before-position="absolute" before-left="0" before-top="2" before-size="2" before-rounded="full" before-bg="primary">
  New feature
</span>`)]),
  sec('limits', 'Limits', [para('Keep pseudo-elements simple. If the generated content becomes meaningful to the user, put it in real markup instead.')]),
]);

reference('layout-display.html', 'Display', 'Control the display mode of an element.', ['display', 'block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'inline-grid', 'table', 'hidden', 'contents'], `<div display="grid">Grid container</div>`);
reference('layout-flex.html', 'Flexbox', 'Build one-dimensional layouts with direction, wrapping, growth, shrink, basis, and order.', ['flex', 'inline-flex', 'flex-row', 'flex-col', 'flex-row-reverse', 'flex-col-reverse', 'direction', 'grow', 'shrink', 'basis', 'wrap', 'no-wrap', 'wrap-reverse', 'order'], `<div display="flex" flex-col md-flex-row gap="4" items="center">...</div>`, undefined, [
  para('Flexbox lays its direct children out along one axis. Start with <code>display="flex"</code>; then choose a direction. A column is useful for stacked content, while a row places items side by side. At a breakpoint, you can change direction without duplicating the content.'),
  code('profile-row.html', `<article display="flex" flex-col md-flex-row items="center" gap="4" p="5" border="border" rounded="xl">
  <img src="avatar.jpg" alt="Portrait of Ada" w="16" h="16" rounded="full" object="cover">
  <div grow="1">
    <h2 font-size="lg" font-weight="bold">Ada Okafor</h2>
    <p text="muted">Design systems engineer</p>
  </div>
  <button px="4" py="2" bg="primary" text="white" rounded="lg">Follow</button>
</article>`),
  para('On narrow screens this stacks the image, details, and button. From <code>md</code> upward, the same children form a row. <code>grow="1"</code> lets the details area take leftover space. If long text forces the row wider than its container, adding <code>min-w="0"</code> to that flexible child allows it to shrink.'),
]);
reference('layout-grid.html', 'Grid', 'Build two-dimensional layouts with columns, rows, spans, named areas, subgrid, and auto-flow.', ['grid', 'inline-grid', 'grid-cols', 'grid-rows', 'grid-template-areas', 'col-span', 'row-span', 'col-start', 'col-end', 'row-start', 'row-end', 'auto-cols', 'auto-rows', 'auto-flow'], `<div display="grid" grid-cols="1" md-grid-cols="3" gap="6">...</div>`, undefined, [
  para('Grid defines rows and columns together, making it a good fit for galleries, dashboards, and cards that need consistent tracks. Apply <code>display="grid"</code> to the parent, then set its columns. The children become grid items automatically.'),
  code('feature-grid.html', `<section display="grid" grid-cols="1" sm-grid-cols="2" lg-grid-cols="3" gap="5">
  <article col-span="1" p="5" border="border" rounded="xl">Overview</article>
  <article p="5" border="border" rounded="xl">Activity</article>
  <article p="5" border="border" rounded="xl">Settings</article>
</section>`),
  para('This starts as one column, becomes two at <code>sm</code>, and three at <code>lg</code>. A span or start/end attribute changes an individual child, while <code>grid-cols</code> belongs on the parent. For explicit track definitions, pass CSS such as <code>grid-template-columns="repeat(3, minmax(0, 1fr))"</code>.'),
]);
reference('layout-alignment.html', 'Alignment', 'Align items, content, and individual children in flex or grid layouts.', ['justify', 'justify-items', 'justify-self', 'items', 'self', 'content', 'place-items', 'place-content', 'place-self', 'center'], `<div display="flex" items="center" justify="between">...</div>`);
reference('layout-gap.html', 'Gap', 'Set row and column spacing inside flex or grid containers.', ['gap', 'gap-x', 'gap-y'], `<div display="grid" gap="4" gap-y="8">...</div>`);
reference('spacing-padding.html', 'Padding', 'Create inner space with physical and writing-mode-aware logical padding properties.', ['p', 'pt', 'pb', 'pl', 'pr', 'px', 'py', 'ps', 'pe', 'padding-inline', 'padding-inline-start', 'padding-inline-end', 'padding-block', 'padding-block-start', 'padding-block-end'], `<section padding-inline="1rem" padding-block="2rem" md-padding-inline="2rem">...</section>`, SPACING_SCALE, [
  para('Padding is the space inside an element, between its border and its content. Use <code>p</code> for all four sides, <code>px</code> for left and right, and <code>py</code> for top and bottom. Side-specific forms such as <code>pt</code> and <code>pe</code> are useful when only one edge needs adjustment.'),
  code('callout.html', `<aside p="5" md-p="8" bg="primary/10" rounded="xl">
  <h2 mb="2" font-size="lg">A little breathing room</h2>
  <p m="0">The padding grows on wider screens.</p>
</aside>`),
  para('Scale values are convenient for consistent spacing; use explicit units when a design calls for a precise value. Logical attributes such as <code>padding-inline</code> adapt to writing direction, while physical forms such as <code>pl</code> always mean left.'),
]);
reference('spacing-margin.html', 'Margin', 'Create outer space with physical and writing-mode-aware logical margin properties.', ['m', 'mt', 'mb', 'ml', 'mr', 'mx', 'my', 'ms', 'me', 'margin-inline', 'margin-inline-start', 'margin-inline-end', 'margin-block', 'margin-block-start', 'margin-block-end', 'mx-auto'], `<main max-w="4xl" margin-inline="auto" margin-block="2rem">...</main>`, SPACING_SCALE);
reference('sizing-width-height.html', 'Width and height', 'Set element dimensions with width, height, and combined size attributes.', ['w', 'h', 'size'], `<button size="10" rounded="full">...</button>`, SPACING_SCALE);
reference('sizing-min-max.html', 'Min and max size', 'Constrain physical or logical dimensions with min and max attributes.', ['min-w', 'max-w', 'min-h', 'max-h', 'min-inline-size', 'max-inline-size', 'min-block-size', 'max-block-size'], `<section min-block-size="100svh" max-inline-size="72rem" mx="auto">...</section>`, SPACING_SCALE);
reference('sizing-aspect.html', 'Aspect ratio', 'Reserve stable media and card proportions with aspect ratio.', ['aspect'], `<img aspect="16 / 9" object-cover rounded="xl" alt="">`);
reference('positioning.html', 'Positioning', 'Control positioning mode and offsets.', ['position', 'static', 'relative', 'absolute', 'fixed', 'sticky'], `<header position="sticky" top="0" z="50">...</header>`);
reference('inset-z-index.html', 'Inset and z-index', 'Set physical offsets, logical insets, and stacking order.', ['top', 'bottom', 'left', 'right', 'inset', 'inset-x', 'inset-y', 'inset-inline', 'inset-inline-start', 'inset-inline-end', 'inset-block', 'inset-block-start', 'inset-block-end', 'z'], `<div position="absolute" inset-inline="0" inset-block-start="0" z="10">...</div>`);
reference('overflow.html', 'Overflow', 'Control clipping, scrolling, and overscroll behavior.', ['overflow', 'overflow-x', 'overflow-y', 'overflow-clip', 'overflow-hidden', 'overflow-scroll', 'overflow-auto', 'overscroll', 'overscroll-x', 'overscroll-y'], `<div max-h="80" overflow-y="auto">...</div>`);
reference('colors-backgrounds.html', 'Backgrounds', 'Set background colors and background rendering behavior.', ['bg', 'bg-color', 'bg-image', 'bg-size', 'bg-position', 'bg-repeat', 'bg-attachment', 'bg-clip', 'bg-origin'], `<section bg="primary/10" dark-bg="gray-900">...</section>`);
reference('colors-text.html', 'Text colors', 'Set foreground text color using semantic tokens, palette tokens, or raw CSS colors.', ['color', 'text', 'text-color', 'caret-color', 'accent-color'], `<p text="muted" hover-text="primary">Readable supporting copy.</p>`);
reference('colors-gradients.html', 'Gradients', 'Use background-image or gradient helper attributes for richer backgrounds.', ['bg-gradient', 'from', 'via', 'to'], `<div bg-gradient="linear-gradient(135deg, var(--primary), #111827)" text="white">...</div>`);
reference('colors-svg.html', 'SVG colors', 'Style SVG fill, stroke, and stroke geometry.', ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset'], `<svg stroke="primary" stroke-width="2" fill="none">...</svg>`);
reference('typography-font.html', 'Font family and size', 'Set font family and text size.', ['font-size', 'text-size', 'font', 'family'], `<h1 font-size="4xl" md-font-size="6xl">Big headline</h1>`, FONT_SIZE_SCALE);
reference('typography-weight-line.html', 'Weight and line height', 'Control typographic weight, leading, tracking, and spacing.', ['weight', 'font-weight', 'leading', 'line-height', 'tracking', 'letter-spacing', 'word-spacing'], `<p font-size="lg" leading="relaxed" weight="medium">...</p>`, { ...FONT_WEIGHT, ...LINE_HEIGHT });
reference('typography-alignment.html', 'Text alignment', 'Align text and inline content.', ['align', 'text-align', 'vertical-align'], `<p align="center" md-align="left">Responsive copy.</p>`);
reference('typography-decoration.html', 'Decoration and case', 'Apply text decoration, decoration styles, casing, and italic state.', ['decoration', 'text-decoration', 'decoration-color', 'decoration-style', 'decoration-thickness', 'underline', 'line-through', 'no-underline', 'text-transform', 'uppercase', 'lowercase', 'capitalize', 'normal-case', 'italic', 'not-italic', 'font-style'], `<a underline decoration-color="primary" uppercase tracking="wide">Link</a>`);
reference('typography-overflow.html', 'Text wrapping and overflow', 'Control balanced wrapping, line clamping, truncation, hyphenation, columns, and list presentation.', ['text-overflow', 'truncate', 'text-ellipsis', 'text-clip', 'text-wrap', 'text-wrap-mode', 'text-wrap-style', 'line-clamp', 'line-clamp-lines', 'whitespace', 'white-space', 'white-space-collapse', 'word-break', 'overflow-wrap', 'hyphens', 'text-indent', 'columns', 'col-count', 'col-width', 'col-gap', 'list-style', 'list-position', 'list-style-image'], `<h2 max-w="32rem" text-wrap="balance">A balanced heading that wraps more naturally</h2>`);
reference('borders-width-color.html', 'Border width and color', 'Set border widths, sides, colors, styles, and logical border edges.', ['border', 'border-width', 'border-color', 'border-style', 'border-t', 'border-b', 'border-l', 'border-r', 'border-x', 'border-y', 'border-inline', 'border-inline-start', 'border-inline-end', 'border-block', 'border-block-start', 'border-block-end', 'border-inline-color', 'border-inline-start-color', 'border-inline-end-color', 'border-block-color', 'border-block-start-color', 'border-block-end-color', 'border-t-color', 'border-b-color', 'border-l-color', 'border-r-color'], `<article border="1px" border-color="gray-200" dark-border-color="gray-800">...</article>`);
reference('borders-radius.html', 'Radius', 'Round all corners or specific corners.', ['rounded', 'radius', 'rounded-t', 'rounded-b', 'rounded-l', 'rounded-r', 'rounded-tl', 'rounded-tr', 'rounded-bl', 'rounded-br', 'rounded-ss', 'rounded-se', 'rounded-es', 'rounded-ee'], `<img rounded="2xl" md-rounded="3xl" alt="">`, RADIUS_SCALE);
reference('borders-outline-ring.html', 'Outline and ring', 'Style focus outlines and ring-like shadows.', ['outline', 'outline-color', 'outline-style', 'outline-offset', 'outline-none', 'ring', 'ring-color', 'ring-offset'], `<button focus-visible-outline="2px" outline-color="primary" outline-offset="2px">Focus me</button>`);
reference('effects-shadow.html', 'Shadows', 'Apply box shadows, text shadows, drop shadows, and shadow color.', ['shadow', 'shadow-color', 'text-shadow', 'drop-shadow'], `<article shadow="xl" hover-shadow="2xl">...</article>`, SHADOW_PRESETS);
reference('effects-opacity.html', 'Opacity', 'Control element opacity for base, hover, and disabled states.', ['opacity'], `<button opacity="100" disabled-opacity="50">Submit</button>`);
reference('effects-transform.html', 'Transforms', 'Compose transform attributes for movement, rotation, scaling, and skew.', ['transform', 'transform-origin', 'transform-style', 'backface', 'perspective', 'scale', 'scale-x', 'scale-y', 'rotate', 'translate-x', 'translate-y', 'translate-z', 'skew-x', 'skew-y'], `<button hover-translate-y="-1" hover-scale="105">Lift</button>`);
reference('effects-filter.html', 'Filters', 'Apply CSS filter functions.', ['filter', 'blur', 'brightness', 'contrast', 'grayscale', 'hue-rotate', 'invert', 'saturate', 'sepia'], `<img grayscale="100" hover-grayscale="0" transition="filter" alt="">`);
reference('effects-backdrop.html', 'Backdrop filters', 'Apply filter effects to the content behind an element.', ['backdrop-filter', 'backdrop-blur', 'backdrop-brightness', 'backdrop-contrast', 'backdrop-grayscale', 'backdrop-hue-rotate', 'backdrop-invert', 'backdrop-opacity', 'backdrop-saturate', 'backdrop-sepia'], `<div bg="white/70" backdrop-blur="md">...</div>`);
reference('motion-transition.html', 'Transitions', 'Control transition property, duration, timing, delay, and discrete transition behavior.', ['transition', 'transition-duration', 'duration', 'transition-timing', 'ease', 'transition-delay', 'delay', 'transition-behavior'], `<button transition="all" duration="200ms" ease="ease-out" hover-bg="primary/80">...</button>`);
reference('motion-animation.html', 'Animation', 'Set animation properties and connect named animations to CSS scroll or view timelines.', ['animate', 'animation-name', 'animation-duration', 'animation-timing', 'animation-delay', 'animation-iteration', 'animation-direction', 'animation-fill', 'animation-play', 'animation-composition', 'animation-timeline', 'animation-range', 'animation-range-start', 'animation-range-end', 'scroll-timeline', 'scroll-timeline-name', 'scroll-timeline-axis', 'view-timeline', 'view-timeline-name', 'view-timeline-axis', 'view-timeline-inset'], `<span animation-name="pulse" animation-duration="1.5s" animation-timeline="view()">Live</span>`);
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
  sec('all-attributes', 'All attributes', [
    para(`Browse all ${allKeys.length} registered attributes and their CSS output. Use the search field to filter by attribute or CSS property.`),
    `<input type="search" data-cheatsheet-filter placeholder="Filter attributes..." aria-label="Filter attributes" w="full" max-w="xl" p="3" mb="4" border="border" rounded="lg">`,
    `<div data-cheatsheet-table>${attrTable(allKeys)}</div>`,
  ]),
  sec('modifiers', 'Modifiers', [
    para('Add these prefixes before an attribute to apply styles at a breakpoint, container size, theme, or element state.'),
    table(['Kind', 'Prefixes'], [
      ['Breakpoints', Object.keys(BREAKPOINTS).map(key => `\`${key}-\``).join(', ')],
      ['Container sizes', Object.keys(CONTAINER_BREAKPOINTS).map(key => `\`${key}-\``).join(', ')],
      ['Theme', '`dark-`'],
      ['States', PSEUDO_STATES.map(key => `\`${key}-\``).join(', ')],
      ['Group', '`group-hover-`'],
    ]),
    code('responsive and container examples', `<div sm-grid-cols="2" md-p="6"></div>
<section container="card / inline-size">
  <div cq-md-grid-cols="2">Two columns when the card is wide enough.</div>
</section>`),
  ]),
]);

// Markdown files in docs/content are the editable source of truth for every
// authored page. The helpers below keep generated reference tables/examples
// available while allowing prose and page structure to be edited per page.
const CONTENT_DIR = join(DOCS_DIR, 'content');
const markdownPages = readdirSync(CONTENT_DIR).filter(file => file.endsWith('.md'));
if (markdownPages.length !== Object.keys(pages).length) {
  throw new Error(`Expected ${Object.keys(pages).length} Markdown doc sources in ${CONTENT_DIR}, found ${markdownPages.length}.`);
}
{
  for (const file of markdownPages) {
    const content = readFileSync(join(CONTENT_DIR, file), 'utf8');
    const slug = file.replace(/\.md$/, '');
    const page = Object.values(pages).find(item => item.file.replace(/\.html$/, '') === slug);
    if (!page) throw new Error(`Unknown docs content page: ${file}`);
    Object.assign(page, parsePageMarkdown(content, page));
  }
}

function parsePageMarkdown(markdown, fallback) {
  const lines = markdown.replace(/\r/g, '').split('\n');
  let title = fallback.title;
  let intro = fallback.intro;
  let group = fallback.group;
  let index = 0;
  while (index < lines.length && !lines[index].trim()) index++;
  if (lines[index]?.startsWith('# ')) title = lines[index++].slice(2).trim();
  if (lines[index]?.startsWith('> ')) intro = lines[index++].slice(2).trim();
  if (lines[index]?.startsWith('<!-- group:')) group = lines[index++].match(/<!-- group:\s*(.*?)\s*-->/)?.[1] || group;
  const sections = [];
  let section;
  let paragraph = [];
  let fence = null;
  let codeLines = [];
  const flushParagraph = () => {
    if (paragraph.length) {
      section.parts.push(para(inlineMarkdown(paragraph.join(' '))));
      paragraph = [];
    }
  };
  const flushCode = () => {
    if (codeLines.length) section.parts.push(code(section.label || 'example', codeLines.join('\n')));
    codeLines = [];
  };
  for (; index < lines.length; index++) {
    const line = lines[index];
    const fenceMatch = line.match(/^\s*(```+|~~~+)(.*)$/);
    if (fence) {
      if (fenceMatch?.[1][0] === fence[0] && fenceMatch[1].length >= fence.length) {
        flushCode(); fence = null;
      } else codeLines.push(line);
      continue;
    }
    if (fenceMatch) {
      flushParagraph();
      fence = fenceMatch[1];
      section.label = fenceMatch[2].trim() || 'example';
    } else if (line.trim() === '<!-- atomattr:attribute-table -->') {
      flushParagraph();
      section.parts.push(`<input type="search" data-cheatsheet-filter placeholder="Filter attributes..." aria-label="Filter attributes" w="full" max-w="xl" p="3" mb="4" border="border" rounded="lg"><div data-cheatsheet-table>${attrTable(allKeys)}</div>`);
    } else if (line.startsWith('## ')) {
      flushParagraph();
      section = { id: slugify(line.slice(3)), title: line.slice(3).trim(), parts: [] };
      sections.push(section);
    } else if (line.trim() && section) paragraph.push(line.trim());
    else flushParagraph();
  }
  flushParagraph();
  if (fence) flushCode();
  return {
    title,
    intro,
    group,
    sections: sections.map(item => {
      const fallbackSection = fallback.sections.find(candidate => candidate.id === item.id);
      return {
        id: item.id,
        title: item.title,
        html: item.parts.length ? item.parts.join('\n') : (fallbackSection?.html || ''),
      };
    }),
    sectionLabels: sections.map(item => item.title),
  };
}

function slugify(text) {
  return text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
}

function inlineMarkdown(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

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
    return `<button border="1px" border-color="gray-200" hover-border-color="primary" focus-visible-outline="2px" focus-visible-outline-color="primary">
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
  if (target.file === 'ui.html') return current.file === 'docs.html' ? 'ui.html' : '../ui.html';
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
  const next = order[index + 1];
  const nextCard = next
    ? pageLinkCard(next, page, 'ri-arrow-right-line')
    : `<a href="../playground.html" text-decoration="none" text="text" border="1px" border-color="gray-100" dark-border-color="gray-900" rounded="lg" py="3" px="5" bg="gray-50" dark-bg="gray-900" flex hover-bg="primary/10" display="block" max-w="fit">
        <div display="flex" items="center" gap="3"><i class="ri-arrow-right-line" aria-hidden="true"></i><strong>Open the playground</strong></div>
      </a>`;

  return `<nav aria-label="Documentation pagination" display="flex" justify="end" max-w="4xl" py="10" border-t="1px" border-color="gray-100" dark-border-color="gray-900">
    ${nextCard}
  </nav>`;
}

function pageLinkCard(target, current, icon) {
  const href = hrefFor(target, current);
  return `<a href="${href}" aria-label="Next page: ${target.label}" text-decoration="none" text="text" border="1px solid gray-200" dark-border-color="gray-800" rounded="lg" py="3" px="5" bg="gray-50" dark-bg="gray-900" flex hover-bg="primary/10" display="flex" items="center" gap="3">
    <i class="${icon}" aria-hidden="true"></i>
    <strong>${target.label}</strong>
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
  const canonicalPath = page.file === 'docs.html' ? 'docs.html' : `docs/${page.file}`;
  const canonicalUrl = `https://devadetayo.github.io/atomattr/${canonicalPath}`;
  const assetPrefix = page.file === 'docs.html' ? './' : '../';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#5b5cf6">
  <meta name="robots" content="index, follow">
  <meta name="author" content="devadetayo">
  <title>${page.title} - Atomattr Docs</title>
  <meta name="description" content="${page.intro.replace(/"/g, '&quot;')}">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="icon" href="${assetPrefix}assets/favico/favico.png" type="image/png">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Atomattr Docs">
  <meta property="og:title" content="${page.title} - Atomattr Docs">
  <meta property="og:description" content="${page.intro.replace(/"/g, '&quot;')}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="https://devadetayo.github.io/atomattr/assets/favico/favico.png">
  <meta property="og:locale" content="en_US">
  <meta property="og:see_also" content="https://github.com/devadetayo/atomattr">
  <meta property="og:see_also" content="https://x.com/devadetayo">
  <meta property="og:see_also" content="https://discord.gg/efCPNK2Wp">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@devadetayo">
  <meta name="twitter:creator" content="@devadetayo">
  <meta name="twitter:title" content="${page.title} - Atomattr Docs">
  <meta name="twitter:description" content="${page.intro.replace(/"/g, '&quot;')}">
  <meta name="twitter:image" content="https://devadetayo.github.io/atomattr/assets/favico/favico.png">
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Atomattr",
      "url": "https://devadetayo.github.io/atomattr/",
      "logo": "https://devadetayo.github.io/atomattr/assets/favico/favico.png",
      "sameAs": [
        "https://github.com/devadetayo/atomattr",
        "https://x.com/devadetayo",
        "https://discord.gg/efCPNK2Wp"
      ],
      "founder": {
        "@type": "Person",
        "name": "devadetayo",
        "sameAs": [
          "https://x.com/devadetayo",
          "https://github.com/devadetayo"
        ]
      }
    }
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link id="hljs-light" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/foundation.min.css" media="(prefers-color-scheme: light)">
  <link id="hljs-dark" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/monokai-sublime.min.css" media="(prefers-color-scheme: dark)">
  <style>html{font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans","Inter",sans-serif}h1,h2,h3{font-family:'Space Grotesk',sans-serif;letter-spacing:0}code,pre,pre code{font-family:'JetBrains Mono',monospace}pre code.hljs{background:transparent!important;padding:0!important}table{border-collapse:collapse}section{scroll-margin-top:120px}</style>
  <link rel="stylesheet" href="${assetPrefix}dist/defaults.css" />
  <link rel="stylesheet" href="${assetPrefix}assets/remixicon/remixicon.css" />
  <link rel="stylesheet" href="${assetPrefix}assets/showcase.css" />
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
      <div px="4" md-pl="calc(20dvw + 4rem)" lg-pr="calc(20dvw + 2rem)" pt="8" md-pt="12" w="full" max-w="100dvw" display="flex" flex-col gap="10" overflow-x="hidden" flex="1">
        <div max-w="3xl">
          <p text="primary" font-size="sm" font-weight="bold" tracking="wide" mb="3">${page.group.toUpperCase()}</p>
          <h1 font-size="2xl" md-font-size="4xl" font-weight="bold" tracking="tight" mb="4">${page.title}</h1>
          <p font-size="md" text="muted" line-height="relaxed" mb="4">${page.intro}</p>
        </div>
        ${page.sections.map(s => `<section id="${s.id}" pt="4" border-t="1px" border-color="gray-100" dark-border-color="gray-900"><h2 font-size="xl" md-font-size="2xl" font-weight="bold" tracking="tight" mb="4" pt="2">${s.title}</h2>${page.file === 'docs.html' ? s.html : s.html.replace(/href="docs\/([^"]+)"/g, 'href="$1"')}</section>`).join('\n')}
        ${pager(page)}
      </div>
      <aside display="none" lg-display="block" fixed top="0" right="0" w="20dvw" min-h="100dvh" pt="24" pr="6" pl="4" z="30">
        <div position="sticky" top="24"><h3 text="muted" font-size="xs" font-weight="700" tracking="wide" mb="3">ON THIS PAGE</h3><div display="flex" flex-col gap="1" border-l="1px" border-color="grey-100" dark-border-color="grey-900">${toc(page)}</div></div>
      </aside>
    </div>
  </main>
  ${searchDataScript(page)}
  <script src="${assetPrefix}dist/atomattr.min.js" defer></script>
  <script type="module" src="${assetPrefix}site/app.js"></script>
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
