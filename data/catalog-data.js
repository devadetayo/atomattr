// Published patterns only. Each preview is the exact AtomAttr HTML shown and
// copied on the detail page. Add an item here when its source is ready.
const components = [
  {
    id: 'button-solid', name: 'Solid button', kind: 'component', variant: 'button',
    description: 'A high contrast primary action for forms and short flows.', tags: ['button', 'action'],
    preview: '<button type="button" bg="primary" hover-bg="primary/80" text="white" px="6" py="3" rounded="lg" border="0" font-weight="600">Get started</button>',
  },
  {
    id: 'button-outline', name: 'Outline button', kind: 'component', variant: 'button',
    description: 'A lower emphasis action with a visible boundary in either theme.', tags: ['button', 'action'],
    preview: '<button type="button" bg="transparent" border="1" border-color="gray-300" dark-border-color="gray-700" text="text" hover-bg="gray-100" dark-hover-bg="gray-900" px="5" py="2.5" rounded="lg" font-weight="600">Learn more</button>',
  },
  {
    id: 'button-group', name: 'Button group', kind: 'component', variant: 'button-group',
    description: 'Related actions grouped in a compact toolbar.', tags: ['button', 'toolbar'],
    preview: '<nav aria-label="Workspace views" display="inline-flex" gap="1" p="1" bg="gray-100" dark-bg="gray-900" rounded="lg"><a href="./components.html" aria-current="page" bg="#fff" dark-bg="gray-800" text="text" shadow="sm" rounded="md" px="3" py="2" text-decoration="none">Overview</a><a href="./sections.html" bg="transparent" text="muted" hover-text="text" rounded="md" px="3" py="2" text-decoration="none">Activity</a></nav>',
  },
  {
    id: 'badge-status', name: 'Status badge', kind: 'component', variant: 'badge',
    description: 'A small label for a status or category.', tags: ['badge', 'status'],
    preview: '<span role="status" display="inline-flex" items="center" gap="2" bg="green-50" dark-bg="green-950" text="green-700" dark-text="green-300" px="3" py="1" rounded="full" font-size="sm" font-weight="600"><span aria-hidden="true" w="2" h="2" rounded="full" bg="green-500"></span>Operational</span>',
  },
  {
    id: 'alert-inline', name: 'Inline alert', kind: 'component', variant: 'alert',
    description: 'A concise status message that remains readable without color.', tags: ['alert', 'feedback'],
    preview: '<div role="status" border-l="4" border-l-color="blue-500" bg="blue-50" dark-bg="blue-950" p="4"><p m="0" font-weight="700">Changes saved</p><p m="0" mt="1" text="muted">Your workspace settings are up to date.</p></div>',
  },
  {
    id: 'stat-card', name: 'Stat card', kind: 'component', variant: 'card',
    description: 'A metric card composition with clearly labelled sample values to replace.', tags: ['card', 'dashboard'],
    preview: '<article bg="#fff" dark-bg="gray-900" border="1" border-color="gray-200" dark-border-color="gray-800" rounded="xl" p="5" w="full" max-w="xs"><p m="0" text="muted" font-size="sm">Example metric · Active users</p><p m="0" mt="2" font-size="3xl" font-weight="700" tracking="tight">12.4k</p><p m="0" mt="2" text="green-700" dark-text="green-300" font-size="sm">Example trend · 8.2%</p></article>',
  },
  {
    id: 'login-form', name: 'Sign-in form', kind: 'component', variant: 'form',
    description: 'A compact, labelled email and password form layout.', tags: ['form', 'auth'],
    preview: '<form aria-label="Sign in" display="flex" flex-col gap="4" bg="#fff" dark-bg="gray-900" border="1" border-color="gray-200" dark-border-color="gray-800" rounded="xl" p="6" w="full" max-w="sm"><h2 m="0" font-size="xl" font-weight="700">Welcome back</h2><label display="flex" flex-col gap="2" font-size="sm" font-weight="600">Email address<input type="email" autocomplete="email" placeholder="you@example.com" required bg="gray-50" dark-bg="gray-950" border="1" border-color="gray-300" dark-border-color="gray-700" text="text" rounded="md" px="3" py="2.5"></label><label display="flex" flex-col gap="2" font-size="sm" font-weight="600">Password<input type="password" autocomplete="current-password" required bg="gray-50" dark-bg="gray-950" border="1" border-color="gray-300" dark-border-color="gray-700" text="text" rounded="md" px="3" py="2.5"></label><button type="button" bg="primary" hover-bg="primary/80" text="white" border="0" rounded="md" py="2.5" font-weight="600">Sign in</button></form>',
  },
  {
    id: 'progress-bar', name: 'Progress indicator', kind: 'component', variant: 'progress',
    description: 'A labelled progress value with native progress semantics.', tags: ['progress', 'status'],
    preview: '<div w="full" max-w="sm"><div display="flex" justify="between" mb="2"><label for="upload-progress" font-size="sm" font-weight="600">Upload progress</label><span font-size="sm" text="muted">64%</span></div><progress id="upload-progress" value="64" max="100" w="full" h="2" aria-label="Upload progress: 64 percent"></progress></div>',
  },
  {
    id: 'avatar-stack', name: 'Avatar group', kind: 'component', variant: 'avatars',
    description: 'An overlapping group of initials avatars with accessible names.', tags: ['avatar', 'people'],
    preview: '<div display="flex" items="center" aria-label="Project members"><span role="img" aria-label="Ari Chen" display="flex" items="center" justify="center" w="10" h="10" rounded="full" bg="blue-100" text="blue-800" border="2" border-color="#fff" dark-border-color="gray-950" font-size="sm" font-weight="700">AC</span><span role="img" aria-label="Mina Okafor" display="flex" items="center" justify="center" w="10" h="10" rounded="full" bg="purple-100" text="purple-800" border="2" border-color="#fff" dark-border-color="gray-950" font-size="sm" font-weight="700" ml="-3">MO</span><span role="img" aria-label="Sam Lee" display="flex" items="center" justify="center" w="10" h="10" rounded="full" bg="amber-100" text="amber-900" border="2" border-color="#fff" dark-border-color="gray-950" font-size="sm" font-weight="700" ml="-3">SL</span></div>',
  },
  {
    id: 'breadcrumb-trail', name: 'Breadcrumbs', kind: 'component', variant: 'breadcrumbs',
    description: 'A semantic breadcrumb trail showing the current location.', tags: ['navigation', 'breadcrumbs'],
    preview: '<nav aria-label="Breadcrumb"><ol display="flex" items="center" gap="2" p="0" m="0" list-style="none" font-size="sm"><li><a href="./catalog.html" text="muted">Library</a></li><li aria-hidden="true" text="muted">/</li><li><a href="./components.html" text="muted">Components</a></li><li aria-hidden="true" text="muted">/</li><li aria-current="page" font-weight="600">Navigation</li></ol></nav>',
  },
  {
    id: 'navigation-tabs', name: 'Navigation tabs', kind: 'component', variant: 'tabs',
    description: 'A simple tab-like navigation row. Links remain usable without JavaScript.', tags: ['navigation', 'tabs'],
    preview: '<nav aria-label="Project views" display="flex" gap="5" border-b="1" border-b-color="gray-200" dark-border-b-color="gray-800"><a href="./catalog.html" aria-current="page" border-b="2" border-b-color="primary" text="primary" py="3" text-decoration="none" font-weight="600">Overview</a><a href="./sections.html" border-b="2" border-b-color="transparent" text="muted" hover-text="text" py="3" text-decoration="none">Sections</a><a href="./docs.html" border-b="2" border-b-color="transparent" text="muted" hover-text="text" py="3" text-decoration="none">Docs</a></nav>',
  },
  {
    id: 'navigation-header', name: 'Product navigation', kind: 'component', variant: 'navigation',
    description: 'A compact product header with a brand link and primary destinations.', tags: ['navigation', 'header'],
    preview: '<header display="flex" items="center" justify="between" gap="5" border-b="1" border-b-color="gray-200" dark-border-b-color="gray-800" py="3"><a href="./index.html" text="text" text-decoration="none" font-weight="700">AtomAttr</a><nav aria-label="Product" display="flex" gap="4" font-size="sm"><a href="./components.html" text="muted">Components</a><a href="./sections.html" text="muted">Sections</a><a href="./docs.html" text="muted">Docs</a></nav></header>',
  },
  {
    id: 'accordion-disclosure', name: 'Disclosure accordion', kind: 'component', variant: 'accordion',
    description: 'Native disclosure rows that can be opened with mouse, touch, or keyboard.', tags: ['accordion', 'disclosure'],
    preview: '<div max-w="xl"><details open border-b="1" border-b-color="gray-200" dark-border-b-color="gray-800" py="4"><summary cursor="pointer" font-weight="600">What is AtomAttr?</summary><p m="0" mt="3" text="muted">An attribute-first styling system for HTML.</p></details><details border-b="1" border-b-color="gray-200" dark-border-b-color="gray-800" py="4"><summary cursor="pointer" font-weight="600">Where can I read the docs?</summary><p m="0" mt="3" text="muted">Use the <a href="./docs.html" text="primary">documentation home</a>.</p></details></div>',
  },
  {
    id: 'pagination-links', name: 'Pagination links', kind: 'component', variant: 'pagination',
    description: 'A small pagination navigation with a clear current-page state.', tags: ['pagination', 'navigation'],
    preview: '<nav aria-label="Pagination" display="flex" items="center" gap="2"><a href="./catalog.html" aria-label="Previous page" border="1" border-color="gray-300" dark-border-color="gray-700" rounded="md" px="3" py="2" text="text">Previous</a><a href="./catalog.html" aria-current="page" aria-label="Page 1" bg="primary" text="white" rounded="md" px="3" py="2">1</a><a href="./sections.html" aria-label="Page 2" border="1" border-color="gray-300" dark-border-color="gray-700" rounded="md" px="3" py="2" text="text">2</a><a href="./sections.html" aria-label="Next page" border="1" border-color="gray-300" dark-border-color="gray-700" rounded="md" px="3" py="2" text="text">Next</a></nav>',
  },
  {
    id: 'select-field', name: 'Select field', kind: 'component', variant: 'form-control',
    description: 'A labelled native select with an explicit initial choice.', tags: ['form', 'input'],
    preview: '<label for="project-kind" display="flex" flex-col gap="2" w="full" max-w="sm" font-size="sm" font-weight="600">Project type<select id="project-kind" name="project-kind" bg="#fff" dark-bg="gray-900" border="1" border-color="gray-300" dark-border-color="gray-700" text="text" rounded="md" px="3" py="2.5"><option value="site">Marketing site</option><option value="application">Web application</option><option value="documentation">Documentation</option></select></label>',
  },
  {
    id: 'popover-menu', name: 'Popover menu', kind: 'component', variant: 'menu',
    description: 'A native popover opened by its associated button without custom JavaScript.', tags: ['menu', 'popover'],
    preview: '<div><button type="button" popovertarget="project-menu" bg="gray-100" dark-bg="gray-900" border="1" border-color="gray-300" dark-border-color="gray-700" text="text" rounded="md" px="4" py="2">Project options</button><div id="project-menu" popover bg="#fff" dark-bg="gray-900" border="1" border-color="gray-200" dark-border-color="gray-700" rounded="lg" p="2"><nav aria-label="Project options" display="grid" gap="1"><a href="./components.html" text="text" text-decoration="none" hover-bg="gray-100" dark-hover-bg="gray-800" rounded="md" px="3" py="2">View components</a><a href="./sections.html" text="text" text-decoration="none" hover-bg="gray-100" dark-hover-bg="gray-800" rounded="md" px="3" py="2">View sections</a></nav></div></div>',
  },
  {
    id: 'tooltip-link', name: 'Helpful link hint', kind: 'component', variant: 'tooltip',
    description: 'A visible hint and native title on a useful documentation link.', tags: ['tooltip', 'help'],
    preview: '<div display="flex" flex-col gap="2" items="start"><a href="./docs/installation.html" title="Open the AtomAttr installation guide" text="primary" font-weight="600">Installation guide</a><span id="install-hint" role="note" text="muted" font-size="sm">Set up AtomAttr in your project.</span></div>',
  },
];

const sections = [
  {
    id: 'hero-centered', name: 'Centered hero', kind: 'section', variant: 'hero',
    description: 'A centered introduction with one clear primary action.', tags: ['hero', 'landing'],
    preview: '<section aria-labelledby="hero-title" text-align="center" py="16" px="4"><p m="0" mb="3" text="primary" font-size="sm" font-weight="700">ATTRIBUTE-FIRST UI</p><h1 id="hero-title" max-w="3xl" mx="auto" m="0" font-size="5xl" font-weight="700" tracking="tight" line-height="tight">Build interfaces with attributes</h1><p max-w="xl" mx="auto" mt="4" mb="7" text="muted" font-size="lg" line-height="relaxed">Put each style decision next to the element it describes.</p><a href="./components.html" display="inline-flex" items="center" bg="primary" text="white" px="5" py="3" rounded="lg" text-decoration="none" font-weight="600">Explore components</a></section>',
  },
  {
    id: 'pricing-single', name: 'Single plan pricing', kind: 'section', variant: 'pricing',
    description: 'One transparent plan with an included feature list.', tags: ['pricing', 'conversion'],
    preview: '<section aria-labelledby="plan-title" display="flex" justify="center" py="12" px="4"><article bg="#fff" dark-bg="gray-900" border="1" border-color="gray-200" dark-border-color="gray-800" rounded="xl" p="7" w="full" max-w="sm"><p m="0" text="primary" font-size="sm" font-weight="700">EXAMPLE PLAN</p><h2 id="plan-title" m="0" mt="3" font-size="2xl">Team</h2><p m="0" mt="2" text="muted">Example price and feature list. Replace these details before publishing.</p><p m="0" mt="5" font-size="4xl" font-weight="700">$19<span font-size="sm" text="muted" font-weight="400"> / month</span></p><ul display="grid" gap="2" mt="5" mb="6" pl="5"><li>Example feature one</li><li>Example feature two</li><li>Example feature three</li></ul><a href="./docs/installation.html" display="block" text-align="center" bg="primary" text="white" py="3" rounded="lg" text-decoration="none" font-weight="600">Read the setup guide</a></article></section>',
  },
  {
    id: 'features-three-column', name: 'Three feature columns', kind: 'section', variant: 'features',
    description: 'Three concise benefits in a responsive grid.', tags: ['features', 'product'],
    preview: '<section aria-labelledby="features-title" py="12" px="4"><h2 id="features-title" m="0" mb="7" text-align="center" font-size="3xl" font-weight="700">A clear way to build</h2><div display="grid" grid-cols="1" md-grid-cols="3" gap="6"><article><h3 m="0" mb="2">Readable markup</h3><p m="0" text="muted" line-height="relaxed">Style decisions stay beside the elements they affect.</p></article><article><h3 m="0" mb="2">Responsive by design</h3><p m="0" text="muted" line-height="relaxed">Add breakpoint variants where the layout changes.</p></article><article><h3 m="0" mb="2">Theme-aware</h3><p m="0" text="muted" line-height="relaxed">Pair light and dark values on the same element.</p></article></div></section>',
  },
  {
    id: 'cta-inline', name: 'Inline call to action', kind: 'section', variant: 'cta',
    description: 'A compact closing prompt with a supporting action.', tags: ['cta', 'conversion'],
    preview: '<section aria-labelledby="cta-title" display="flex" flex-col md-flex-row items="start" md-items="center" justify="between" gap="5" bg="gray-50" dark-bg="gray-900" border="1" border-color="gray-200" dark-border-color="gray-800" rounded="xl" p="7"><div><h2 id="cta-title" m="0" font-size="2xl">Ready to try the patterns?</h2><p m="0" mt="2" text="muted">Start with a component and make it yours.</p></div><a href="./components.html" bg="primary" text="white" px="5" py="3" rounded="lg" text-decoration="none" font-weight="600">Browse components</a></section>',
  },
  {
    id: 'faq-list', name: 'FAQ list', kind: 'section', variant: 'faq',
    description: 'Native disclosure rows that work with keyboard and without JavaScript.', tags: ['faq', 'content'],
    preview: '<section aria-labelledby="faq-title" max-w="3xl" mx="auto" py="10" px="4"><h2 id="faq-title" m="0" mb="5" font-size="3xl">Frequently asked questions</h2><details open border-b="1" border-b-color="gray-200" dark-border-b-color="gray-800" py="4"><summary cursor="pointer" font-weight="600">Do I need a build step?</summary><p mb="0" mt="3" text="muted">No. The browser engine can read attributes directly from HTML.</p></details><details border-b="1" border-b-color="gray-200" dark-border-b-color="gray-800" py="4"><summary cursor="pointer" font-weight="600">Can I use my own styles too?</summary><p mb="0" mt="3" text="muted">Yes. AtomAttr works alongside regular CSS.</p></details></section>',
  },
  {
    id: 'footer-simple', name: 'Simple footer', kind: 'section', variant: 'footer',
    description: 'A compact footer with useful product and documentation links.', tags: ['footer', 'navigation'],
    preview: '<footer border-t="1" border-t-color="gray-200" dark-border-t-color="gray-800" py="6" px="4"><div max-w="6xl" mx="auto" display="flex" flex-col sm-flex-row items="start" sm-items="center" justify="between" gap="4"><a href="./index.html" text="text" text-decoration="none" font-weight="700">AtomAttr</a><nav aria-label="Footer" display="flex" gap="4" font-size="sm"><a href="./docs.html" text="muted">Documentation</a><a href="./components.html" text="muted">Components</a><a href="./playground.html" text="muted">Playground</a></nav><small text="muted">Attribute-first styling for HTML.</small></div></footer>',
  },
  {
    id: 'workflow-steps', name: 'Explore, preview, copy', kind: 'section', variant: 'steps',
    description: 'A three-step explainer matching the library workflow.', tags: ['workflow', 'product'],
    preview: '<section aria-labelledby="workflow-title" py="12" px="4"><h2 id="workflow-title" m="0" mb="6" font-size="3xl">From pattern to project</h2><ol display="grid" grid-cols="1" md-grid-cols="3" gap="6" p="0" m="0" list-style="none"><li><p m="0" mb="2" text="primary" font-size="sm" font-weight="700">01 · EXPLORE</p><h3 m="0" mb="2">Find a pattern</h3><p m="0" text="muted">Search the component and section library.</p></li><li><p m="0" mb="2" text="primary" font-size="sm" font-weight="700">02 · PREVIEW</p><h3 m="0" mb="2">Inspect the result</h3><p m="0" text="muted">Check the live preview and switch themes.</p></li><li><p m="0" mb="2" text="primary" font-size="sm" font-weight="700">03 · COPY</p><h3 m="0" mb="2">Use the source</h3><p m="0" text="muted">Copy the HTML or React-ready example.</p></li></ol></section>',
  },
  {
    id: 'section-intro-copy', name: 'Section introduction', kind: 'section', variant: 'intro',
    description: 'A title and short description to introduce a page section.', tags: ['content', 'intro'],
    preview: '<section aria-labelledby="intro-title" max-w="3xl" mx="auto" py="10" px="4"><p m="0" mb="3" text="primary" font-size="sm" font-weight="700">BUILT FOR HTML</p><h2 id="intro-title" m="0" font-size="4xl" tracking="tight">Keep styles close to the element</h2><p m="0" mt="4" text="muted" font-size="lg" line-height="relaxed">AtomAttr uses HTML attributes as the styling interface, so a component can show its structure and presentation together.</p></section>',
  },
  {
    id: 'announcement-bar', name: 'Documentation announcement', kind: 'section', variant: 'announcement',
    description: 'A slim announcement with a useful documentation destination.', tags: ['announcement', 'navigation'],
    preview: '<aside aria-label="Announcement" bg="gray-100" dark-bg="gray-900" p="3"><p m="0" text-align="center" font-size="sm">New to AtomAttr? <a href="./docs/installation.html" text="primary" font-weight="600">Read the installation guide</a></p></aside>',
  },
  {
    id: 'contact-panel', name: 'Contact panel', kind: 'section', variant: 'contact',
    description: 'A straightforward contact prompt with a real email link.', tags: ['contact', 'cta'],
    preview: '<section aria-labelledby="contact-title" bg="gray-50" dark-bg="gray-900" rounded="xl" p="7"><h2 id="contact-title" m="0" font-size="2xl">Talk with the team</h2><p m="0" mt="2" mb="5" text="muted">Ask a question about integrating AtomAttr into your project.</p><a href="mailto:hello@atomattr.dev" text="primary" font-weight="600">hello@atomattr.dev</a></section>',
  },
];

export const catalogCategories = ['Components', 'Sections', 'Templates'];

export const catalogItems = [...components, ...sections].map((item) => ({
  ...item,
  slug: item.id,
  category: item.kind === 'component' ? 'Components' : 'Sections',
  access: 'free',
  price: 0,
  frameworks: ['HTML', 'React'],
  publicationStatus: 'published',
  sourceVariants: ['HTML', 'React'],
}));
