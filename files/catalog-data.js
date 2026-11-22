/* AtomAttr UI catalog. Add designs with the private studio (admin.html), then paste the exported
   objects into `catalogItems` below. Only items with status "published" appear publicly. */

const CREATOR = 'Adeniyi Adetayo';
const LICENSE = 'Free to use'; // TODO owner: replace with your real license text

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const mk = (category, name, description, tags, preview, extra = {}) => {
  const slug = slugify(`${category}-${name}`);
  return { id: slug, slug, name, description, category, tags, preview: preview.trim(), creator: CREATOR, license: LICENSE, origin: 'official', status: 'published', added: '2026-10-21', ...extra };
};
const links = (attrs, arr) => arr.map((t) => `<a href="#" ${attrs} text-decoration="none">${t}</a>`).join('\n    ');
const NAV = ['Product', 'Pricing', 'Docs', 'Blog'];
const L = (attrs, arr = NAV) => links(attrs, arr);
const MUTED = 'text="muted" hover-text="text" font-size="sm"';
const BAR = 'bg="#fff" dark-bg="gray-950" border-b="1px" border-color="gray-200" dark-border-color="#ffffff/10"';
const CTA = 'bg="primary" hover-bg="primary/80" text="white" px="4" py="2" rounded="lg" font-size="sm" font-weight="600" text-decoration="none"';

/* ============================ NAVBARS (15) ============================ */
const navbars = [
  mk('Navbars', 'Classic', 'Logo, centered links and a primary call to action.', ['navbar', 'classic', 'saas'], `
<nav display="flex" items="center" justify="between" px="6" py="4" ${BAR}>
  <a href="#" font-weight="700" font-size="lg" text="text" text-decoration="none">Acme</a>
  <div display="none" md-display="flex" gap="6">
    ${L(MUTED)}
  </div>
  <a href="#" ${CTA}>Get started</a>
</nav>`, { featured: true }),

  mk('Navbars', 'Centered Logo', 'Links left, brand mark in the middle, utility icons right. Good for stores.', ['navbar', 'ecommerce', 'centered'], `
<nav display="grid" grid-cols="3" items="center" px="6" py="4" ${BAR}>
  <div display="flex" gap="5">
    ${L(MUTED, ['Shop', 'Journal', 'About'])}
  </div>
  <a href="#" justify-self="center" font-weight="700" font-size="xl" tracking="wide" text="text" text-decoration="none">ATELIER</a>
  <div display="flex" items="center" justify="end" gap="4" text="text" font-size="lg"><i class="ri-search-line"></i><i class="ri-user-line"></i><i class="ri-shopping-bag-line"></i></div>
</nav>`),

  mk('Navbars', 'Glass Pill', 'Frosted floating pill over a gradient. Uses backdrop-blur and alpha colors.', ['navbar', 'glass', 'floating'], `
<div p="4" pb="20" bg-gradient="linear-gradient(135deg,#5b5cf6,#d946ef)">
  <nav display="flex" items="center" justify="between" px="5" py="3" bg="#ffffff/15" backdrop-blur="md" border="1px solid #ffffff/25" rounded="full">
    <a href="#" font-weight="700" text="white" text-decoration="none">Nova</a>
    <div display="none" md-display="flex" gap="6">
      ${L('text="#fff/80" hover-text="white" font-size="sm"')}
    </div>
    <a href="#" bg="white" text="#4338ca" px="4" py="2" rounded="full" font-size="sm" font-weight="600" text-decoration="none">Sign in</a>
  </nav>
</div>`, { featured: true, page: false }),

  mk('Navbars', 'Dark Pill', 'High-contrast floating pill that inverts in dark mode.', ['navbar', 'floating', 'dark'], `
<div p="4">
  <nav display="flex" items="center" justify="between" px="5" py="3" bg="gray-950" dark-bg="#fff" text="white" dark-text="gray-950" rounded="full" shadow="lg">
    <a href="#" font-weight="700" text-decoration="none" color="inherit">Orbit</a>
    <div display="none" md-display="flex" gap="6">
      ${L('opacity="70" hover-opacity="100" font-size="sm" color="inherit"')}
    </div>
    <a href="#" bg="primary" text="white" px="4" py="2" rounded="full" font-size="sm" font-weight="600" text-decoration="none">Join</a>
  </nav>
</div>`, { featured: true }),

  mk('Navbars', 'Search Bar', 'Brand, command-style search field, notifications and avatar.', ['navbar', 'search', 'app'], `
<nav display="flex" items="center" gap="4" px="6" py="3" ${BAR}>
  <a href="#" font-weight="700" text="text" text-decoration="none">Pulse</a>
  <div display="none" md-display="flex" items="center" gap="2" flex="1" max-w="md" mx="auto" bg="gray-100" dark-bg="#ffffff/5" rounded="xl" px="3" py="2" text="muted" font-size="sm">
    <i class="ri-search-line"></i><span flex="1">Search anything…</span><kbd bg="#fff" dark-bg="#ffffff/10" rounded="md" px="1.5" font-size="xs">⌘K</kbd>
  </div>
  <div display="flex" items="center" gap="3" ml="auto" text="muted" font-size="lg"><i class="ri-notification-3-line"></i>
    <span w="8" h="8" rounded="full" bg="primary" text="white" display="flex" items="center" justify="center" font-size="xs" font-weight="700">CA</span></div>
</nav>`),

  mk('Navbars', 'Underline Tabs', 'Section navigation with a primary underline on the active tab.', ['navbar', 'tabs', 'dashboard'], `
<nav px="6" ${BAR}>
  <div display="flex" items="center" justify="between">
    <a href="#" font-weight="700" text="text" text-decoration="none">Console</a>
    <div display="flex" gap="6" font-size="sm">
      <a href="#" py="4" border-b="2px" border-color="primary" text="text" font-weight="600" text-decoration="none">Overview</a>
      <a href="#" py="4" border-b="2px" border-color="transparent" text="muted" hover-text="text" text-decoration="none">Activity</a>
      <a href="#" py="4" border-b="2px" border-color="transparent" text="muted" hover-text="text" text-decoration="none">Billing</a>
      <a href="#" py="4" border-b="2px" border-color="transparent" text="muted" hover-text="text" text-decoration="none">Settings</a>
    </div>
  </div>
</nav>`),

  mk('Navbars', 'Segmented', 'Centered segmented control for switching between views.', ['navbar', 'segmented', 'pill'], `
<nav display="flex" items="center" justify="between" px="6" py="3" ${BAR}>
  <a href="#" font-weight="700" text="text" text-decoration="none">Flow</a>
  <div display="inline-flex" gap="1" p="1" bg="gray-100" dark-bg="#ffffff/5" rounded="full" font-size="sm" font-weight="600">
    <a href="#" px="4" py="1.5" rounded="full" bg="#fff" dark-bg="#ffffff/15" shadow="sm" text="text" text-decoration="none">Board</a>
    <a href="#" px="4" py="1.5" rounded="full" text="muted" text-decoration="none">List</a>
    <a href="#" px="4" py="1.5" rounded="full" text="muted" text-decoration="none">Timeline</a>
  </div>
  <a href="#" ${CTA}>New task</a>
</nav>`),

  mk('Navbars', 'Announcement', 'Dismissible-style announcement strip stacked above a standard bar.', ['navbar', 'banner', 'marketing'], `
<div>
  <div bg="primary" text="white" align="center" font-size="sm" py="2" px="4">Version 2 is live. <a href="#" text="white" underline>Read the changelog</a></div>
  <nav display="flex" items="center" justify="between" px="6" py="4" ${BAR}>
    <a href="#" font-weight="700" font-size="lg" text="text" text-decoration="none">Beacon</a>
    <div display="none" md-display="flex" gap="6">
      ${L(MUTED, ['Features', 'Changelog', 'Pricing'])}
    </div>
    <a href="#" ${CTA}>Try free</a>
  </nav>
</div>`),

  mk('Navbars', 'App Bar', 'Dashboard top bar with menu toggle, page title, icons and avatar.', ['navbar', 'dashboard', 'app'], `
<header display="flex" items="center" gap="4" px="5" py="3" ${BAR}>
  <button type="button" aria-label="Menu" w="10" h="10" rounded="lg" bg="transparent" hover-bg="gray-100" dark-hover-bg="#ffffff/5" border="0" text="text" font-size="xl" cursor="pointer"><i class="ri-menu-line"></i></button>
  <div><p m="0" text="muted" font-size="xs">Workspace / Reports</p><h1 m="0" font-size="lg" font-weight="700">Revenue</h1></div>
  <div display="flex" items="center" gap="2" ml="auto">
    <button type="button" aria-label="Search" w="10" h="10" rounded="full" bg="transparent" hover-bg="gray-100" dark-hover-bg="#ffffff/5" border="0" text="muted" font-size="xl" cursor="pointer"><i class="ri-search-line"></i></button>
    <button type="button" aria-label="Notifications" position="relative" w="10" h="10" rounded="full" bg="transparent" hover-bg="gray-100" dark-hover-bg="#ffffff/5" border="0" text="muted" font-size="xl" cursor="pointer"><i class="ri-notification-3-line"></i><span position="absolute" top="2" right="2.5" w="2" h="2" rounded="full" bg="danger"></span></button>
    <span w="9" h="9" rounded="full" bg="primary" text="white" display="flex" items="center" justify="center" font-size="sm" font-weight="700">CA</span>
  </div>
</header>`),

  mk('Navbars', 'Mega Menu', 'Navbar with an open mega menu panel: icon tiles with titles and descriptions.', ['navbar', 'mega-menu', 'dropdown'], `
<div position="relative">
  <nav display="flex" items="center" gap="6" px="6" py="4" ${BAR}>
    <a href="#" font-weight="700" font-size="lg" text="text" text-decoration="none">Stack</a>
    <a href="#" text="primary" font-size="sm" font-weight="600" text-decoration="none">Products <i class="ri-arrow-down-s-line"></i></a>
    ${L(MUTED, ['Solutions', 'Pricing', 'Docs'])}
  </nav>
  <div display="grid" grid-cols="3" gap="3" p="4" mx="6" bg="#fff" dark-bg="#101113" border="1px solid gray-200" dark-border-color="#ffffff/10" rounded="2xl" shadow="xl">
    <a href="#" display="flex" gap="3" p="3" rounded="xl" hover-bg="gray-50" dark-hover-bg="#ffffff/5" text="text" text-decoration="none"><span w="10" h="10" flex="none" rounded="lg" bg="primary/10" text="primary" display="flex" items="center" justify="center" font-size="xl"><i class="ri-bar-chart-2-line"></i></span><span><b display="block" font-size="sm">Analytics</b><span text="muted" font-size="xs">Track every metric</span></span></a>
    <a href="#" display="flex" gap="3" p="3" rounded="xl" hover-bg="gray-50" dark-hover-bg="#ffffff/5" text="text" text-decoration="none"><span w="10" h="10" flex="none" rounded="lg" bg="success/10" text="success" display="flex" items="center" justify="center" font-size="xl"><i class="ri-flashlight-line"></i></span><span><b display="block" font-size="sm">Automation</b><span text="muted" font-size="xs">Workflows that run</span></span></a>
    <a href="#" display="flex" gap="3" p="3" rounded="xl" hover-bg="gray-50" dark-hover-bg="#ffffff/5" text="text" text-decoration="none"><span w="10" h="10" flex="none" rounded="lg" bg="warning/10" text="warning" display="flex" items="center" justify="center" font-size="xl"><i class="ri-shield-check-line"></i></span><span><b display="block" font-size="sm">Security</b><span text="muted" font-size="xs">Keep data safe</span></span></a>
  </div>
</div>`, { frame: { w: 860, h: 320 } }),

  mk('Navbars', 'Brutalist', 'Thick borders, uppercase links and a hard offset shadow.', ['navbar', 'brutalist', 'bold'], `
<nav display="flex" items="center" justify="between" px="6" py="4" bg="#facc15" border-b="2px" border-color="#000">
  <a href="#" font-weight="800" font-size="xl" text="#000" text-decoration="none" uppercase>Punk.</a>
  <div display="none" md-display="flex" gap="6">
    ${L('text="#000" font-size="sm" font-weight="800" uppercase', ['Work', 'Studio', 'Contact'])}
  </div>
  <a href="#" bg="#000" text="#fff" px="5" py="2" font-size="sm" font-weight="800" text-decoration="none" uppercase shadow="4px 4px 0 #fff" border="2px solid #000">Hire us</a>
</nav>`, { page: false }),

  mk('Navbars', 'Gradient CTA', 'Clean bar with a gradient brand dot and a gradient action button.', ['navbar', 'gradient', 'startup'], `
<nav display="flex" items="center" justify="between" px="6" py="4" ${BAR}>
  <a href="#" display="inline-flex" items="center" gap="2" font-weight="700" font-size="lg" text="text" text-decoration="none"><span w="6" h="6" rounded="lg" bg-gradient="linear-gradient(135deg,#6366f1,#d946ef)"></span>Lumen</a>
  <div display="none" md-display="flex" gap="6">
    ${L(MUTED, ['Features', 'Customers', 'Pricing'])}
  </div>
  <a href="#" text="white" px="5" py="2" rounded="full" font-size="sm" font-weight="600" text-decoration="none" bg-gradient="linear-gradient(90deg,#6366f1,#d946ef)" shadow="lg">Start free</a>
</nav>`, { featured: true }),

  mk('Navbars', 'Split Auth', 'Brand and links on the left, login and sign-up separated by a divider.', ['navbar', 'auth', 'split'], `
<nav display="flex" items="center" justify="between" px="6" py="4" ${BAR}>
  <div display="flex" items="center" gap="8">
    <a href="#" font-weight="700" font-size="lg" text="text" text-decoration="none">Vault</a>
    <div display="none" md-display="flex" gap="5">
      ${L(MUTED, ['Solutions', 'Security', 'Pricing'])}
    </div>
  </div>
  <div display="flex" items="center" gap="4">
    <a href="#" text="text" font-size="sm" font-weight="600" text-decoration="none">Log in</a>
    <span w="1px" h="5" bg="gray-200" dark-bg="#ffffff/15"></span>
    <a href="#" border="1px solid gray-300" dark-border-color="#ffffff/20" text="text" px="4" py="2" rounded="lg" font-size="sm" font-weight="600" text-decoration="none" hover-bg="gray-100" dark-hover-bg="#ffffff/5">Sign up</a>
  </div>
</nav>`),

  mk('Navbars', 'Icon Rail', 'Stacked icon-and-label links, centered. Works well for mobile-first apps.', ['navbar', 'icons', 'mobile'], `
<nav display="flex" items="center" justify="center" gap="8" px="6" py="3" ${BAR}>
  <a href="#" display="flex" flex-col items="center" gap="1" text="primary" font-size="xs" font-weight="600" text-decoration="none"><i class="ri-home-5-fill" font-size="xl"></i>Home</a>
  <a href="#" display="flex" flex-col items="center" gap="1" text="muted" hover-text="text" font-size="xs" font-weight="600" text-decoration="none"><i class="ri-compass-3-line" font-size="xl"></i>Explore</a>
  <a href="#" display="flex" flex-col items="center" gap="1" text="muted" hover-text="text" font-size="xs" font-weight="600" text-decoration="none"><i class="ri-chat-3-line" font-size="xl"></i>Inbox</a>
  <a href="#" display="flex" flex-col items="center" gap="1" text="muted" hover-text="text" font-size="xs" font-weight="600" text-decoration="none"><i class="ri-user-3-line" font-size="xl"></i>Profile</a>
</nav>`),

  mk('Navbars', 'Hero Overlay', 'Transparent white navbar sitting on a dark gradient hero.', ['navbar', 'transparent', 'hero'], `
<div pb="16" bg-gradient="linear-gradient(180deg,#0b0c0f,#1e1b4b)">
  <nav display="flex" items="center" justify="between" px="6" py="5">
    <a href="#" font-weight="700" font-size="lg" text="white" text-decoration="none">Aurora</a>
    <div display="none" md-display="flex" gap="6">
      ${L('text="#fff/70" hover-text="white" font-size="sm"', ['Explore', 'Stories', 'Pricing'])}
    </div>
    <a href="#" border="1px solid #ffffff/30" text="white" px="4" py="2" rounded="full" font-size="sm" font-weight="600" text-decoration="none" hover-bg="#ffffff/10">Get access</a>
  </nav>
  <h1 align="center" m="0" mt="8" px="6" text="white" font-size="4xl" font-weight="700" tracking="tight">Build in the open.</h1>
</div>`, { page: false }),
];

/* ============================ BUTTONS (12) ============================ */
const row = (inner) => `<div display="flex" wrap items="center" justify="center" gap="3">\n${inner}\n</div>`;
const buttons = [
  mk('Buttons', 'Solid Sizes', 'Primary solid buttons in small, medium and large.', ['button', 'solid', 'sizes'], row(`
  <button type="button" bg="primary" hover-bg="primary/80" text="white" border="0" px="3" py="1.5" rounded="md" font-size="sm" font-weight="600" cursor="pointer">Small</button>
  <button type="button" bg="primary" hover-bg="primary/80" text="white" border="0" px="4" py="2.5" rounded="lg" font-weight="600" cursor="pointer">Medium</button>
  <button type="button" bg="primary" hover-bg="primary/80" text="white" border="0" px="6" py="3.5" rounded="xl" font-size="lg" font-weight="600" cursor="pointer">Large</button>`), { featured: true }),

  mk('Buttons', 'Outline', 'Bordered buttons that fill softly on hover.', ['button', 'outline'], row(`
  <button type="button" bg="transparent" hover-bg="primary/10" text="primary" border="1px solid primary" px="4" py="2.5" rounded="lg" font-weight="600" cursor="pointer">Primary</button>
  <button type="button" bg="transparent" hover-bg="gray-100" dark-hover-bg="#ffffff/5" text="text" border="1px solid gray-300" dark-border-color="#ffffff/20" px="4" py="2.5" rounded="lg" font-weight="600" cursor="pointer">Neutral</button>
  <button type="button" bg="transparent" hover-bg="danger/10" text="danger" border="1px solid danger" px="4" py="2.5" rounded="lg" font-weight="600" cursor="pointer">Danger</button>`)),

  mk('Buttons', 'Soft Tint', 'Low-contrast tinted buttons built from alpha colors.', ['button', 'soft', 'tint'], row(`
  <button type="button" bg="primary/10" hover-bg="primary/20" text="primary" border="0" px="4" py="2.5" rounded="lg" font-weight="600" cursor="pointer">Primary</button>
  <button type="button" bg="success/10" hover-bg="success/20" text="success" border="0" px="4" py="2.5" rounded="lg" font-weight="600" cursor="pointer">Success</button>
  <button type="button" bg="warning/10" hover-bg="warning/20" text="warning" border="0" px="4" py="2.5" rounded="lg" font-weight="600" cursor="pointer">Warning</button>`)),

  mk('Buttons', 'Ghost', 'Text-only buttons that reveal a background on hover.', ['button', 'ghost', 'minimal'], row(`
  <button type="button" bg="transparent" hover-bg="gray-100" dark-hover-bg="#ffffff/5" text="text" border="0" px="4" py="2.5" rounded="lg" font-weight="600" cursor="pointer">Cancel</button>
  <button type="button" bg="transparent" hover-bg="gray-100" dark-hover-bg="#ffffff/5" text="muted" border="0" px="4" py="2.5" rounded="lg" font-weight="600" cursor="pointer">Learn more</button>
  <button type="button" bg="transparent" hover-bg="primary/10" text="primary" border="0" px="4" py="2.5" rounded="lg" font-weight="600" cursor="pointer">Skip</button>`)),

  mk('Buttons', 'Gradient Glow', 'Gradient fills with a soft colored shadow.', ['button', 'gradient', 'glow'], row(`
  <button type="button" text="white" border="0" px="6" py="3" rounded="full" font-weight="600" cursor="pointer" bg-gradient="linear-gradient(90deg,#6366f1,#d946ef)" shadow="0 8px 24px rgba(99,102,241,.4)">Upgrade</button>
  <button type="button" text="white" border="0" px="6" py="3" rounded="full" font-weight="600" cursor="pointer" bg-gradient="linear-gradient(90deg,#f97316,#ef4444)" shadow="0 8px 24px rgba(239,68,68,.35)">Go live</button>`), { featured: true }),

  mk('Buttons', 'Icon and Label', 'Leading and trailing icons with consistent spacing.', ['button', 'icon'], row(`
  <button type="button" display="inline-flex" items="center" gap="2" bg="primary" hover-bg="primary/80" text="white" border="0" px="4" py="2.5" rounded="lg" font-weight="600" cursor="pointer"><i class="ri-download-line"></i> Download</button>
  <button type="button" display="inline-flex" items="center" gap="2" bg="transparent" hover-bg="gray-100" dark-hover-bg="#ffffff/5" text="text" border="1px solid gray-300" dark-border-color="#ffffff/20" px="4" py="2.5" rounded="lg" font-weight="600" cursor="pointer"><i class="ri-share-line"></i> Share</button>
  <button type="button" display="inline-flex" items="center" gap="2" bg="gray-950" dark-bg="#fff" text="white" dark-text="gray-950" border="0" px="4" py="2.5" rounded="lg" font-weight="600" cursor="pointer">Continue <i class="ri-arrow-right-line"></i></button>`)),

  mk('Buttons', 'Pill Arrow', 'Pill button with a circular arrow badge.', ['button', 'pill', 'arrow'], row(`
  <button type="button" display="inline-flex" items="center" gap="3" bg="gray-950" dark-bg="#fff" text="white" dark-text="gray-950" border="0" pl="5" pr="2" py="2" rounded="full" font-weight="600" cursor="pointer">Book a demo <span w="8" h="8" rounded="full" bg="primary" text="white" display="flex" items="center" justify="center"><i class="ri-arrow-right-up-line"></i></span></button>
  <button type="button" display="inline-flex" items="center" gap="3" bg="primary" text="white" border="0" pl="5" pr="2" py="2" rounded="full" font-weight="600" cursor="pointer">Start now <span w="8" h="8" rounded="full" bg="#fff/20" text="white" display="flex" items="center" justify="center"><i class="ri-arrow-right-line"></i></span></button>`)),

  mk('Buttons', '3D Press', 'Chunky buttons with a solid offset edge.', ['button', '3d', 'playful'], row(`
  <button type="button" bg="primary" text="white" border="0" px="6" py="3" rounded="xl" font-weight="700" cursor="pointer" shadow="0 5px 0 #3b3cc4">Play</button>
  <button type="button" bg="success" text="white" border="0" px="6" py="3" rounded="xl" font-weight="700" cursor="pointer" shadow="0 5px 0 #15803d">Claim</button>
  <button type="button" bg="#facc15" text="#000" border="0" px="6" py="3" rounded="xl" font-weight="700" cursor="pointer" shadow="0 5px 0 #a16207">Spin</button>`)),

  mk('Buttons', 'Icon Only', 'Round and rounded-square icon buttons with labels for screen readers.', ['button', 'icon-only', 'toolbar'], row(`
  <button type="button" aria-label="Like" w="11" h="11" rounded="full" bg="primary" text="white" border="0" display="flex" items="center" justify="center" font-size="xl" cursor="pointer"><i class="ri-heart-line"></i></button>
  <button type="button" aria-label="Bookmark" w="11" h="11" rounded="xl" bg="gray-100" dark-bg="#ffffff/10" hover-bg="gray-200" text="text" border="0" display="flex" items="center" justify="center" font-size="xl" cursor="pointer"><i class="ri-bookmark-line"></i></button>
  <button type="button" aria-label="Settings" w="11" h="11" rounded="xl" bg="transparent" text="text" border="1px solid gray-300" dark-border-color="#ffffff/20" display="flex" items="center" justify="center" font-size="xl" cursor="pointer"><i class="ri-settings-3-line"></i></button>`)),

  mk('Buttons', 'Status', 'Success, warning and danger actions.', ['button', 'status', 'semantic'], row(`
  <button type="button" bg="success" hover-bg="success/80" text="white" border="0" px="4" py="2.5" rounded="lg" font-weight="600" cursor="pointer">Approve</button>
  <button type="button" bg="warning" hover-bg="warning/80" text="#000" border="0" px="4" py="2.5" rounded="lg" font-weight="600" cursor="pointer">Review</button>
  <button type="button" bg="danger" hover-bg="danger/80" text="white" border="0" px="4" py="2.5" rounded="lg" font-weight="600" cursor="pointer">Delete</button>`)),

  mk('Buttons', 'Button Group', 'Joined segmented buttons sharing a single border.', ['button', 'group', 'segmented'], `
<div display="inline-flex" rounded="lg" overflow="hidden" border="1px solid gray-300" dark-border-color="#ffffff/20">
  <button type="button" bg="primary" text="white" border="0" px="4" py="2" font-weight="600" cursor="pointer">Day</button>
  <button type="button" bg="transparent" hover-bg="gray-100" dark-hover-bg="#ffffff/5" text="text" border="0" border-l="1px" border-l-color="gray-300" px="4" py="2" font-weight="600" cursor="pointer">Week</button>
  <button type="button" bg="transparent" hover-bg="gray-100" dark-hover-bg="#ffffff/5" text="text" border="0" border-l="1px" border-l-color="gray-300" px="4" py="2" font-weight="600" cursor="pointer">Month</button>
</div>`),

  mk('Buttons', 'Social Login', 'Full-width provider buttons for sign-in screens.', ['button', 'social', 'auth'], `
<div display="grid" gap="3" w="full" max-w="18rem">
  <button type="button" display="flex" items="center" justify="center" gap="3" bg="#fff" dark-bg="#17181b" hover-bg="gray-50" text="text" border="1px solid gray-300" dark-border-color="#ffffff/15" px="4" py="3" rounded="xl" font-weight="600" cursor="pointer"><i class="ri-google-fill"></i> Continue with Google</button>
  <button type="button" display="flex" items="center" justify="center" gap="3" bg="gray-950" dark-bg="#fff" text="white" dark-text="gray-950" border="0" px="4" py="3" rounded="xl" font-weight="600" cursor="pointer"><i class="ri-github-fill"></i> Continue with GitHub</button>
</div>`),
];

/* ============================ CARDS / FORMS / FEEDBACK ============================ */
const others = [
  mk('Cards', 'Profile', 'Cover, avatar, name and follow action.', ['card', 'profile', 'social'], `
<div w="full" max-w="20rem" bg="#fff" dark-bg="#17181b" border="1px solid gray-200" dark-border-color="#ffffff/10" rounded="2xl" overflow="hidden" shadow="md">
  <div h="20" bg-gradient="linear-gradient(135deg,#5b5cf6,#a78bfa)"></div>
  <div px="5" pb="5">
    <span w="16" h="16" rounded="full" bg="primary" text="white" display="flex" items="center" justify="center" font-size="xl" font-weight="700" border="4px solid #fff" dark-border-color="#17181b" mt="-2rem">AA</span>
    <h3 m="0" mt="3" font-size="lg">Ada Adeyemi</h3>
    <p m="0" mt="1" text="muted" font-size="sm">Product designer in Lagos</p>
    <button type="button" mt="4" w="full" bg="primary" hover-bg="primary/80" text="white" border="0" py="2.5" rounded="lg" font-weight="600" cursor="pointer">Follow</button>
  </div>
</div>`),

  mk('Cards', 'Pricing', 'Plan name, price and a call to action.', ['card', 'pricing'], `
<div w="full" max-w="16rem" bg="#fff" dark-bg="#17181b" border="1px solid gray-200" dark-border-color="#ffffff/10" rounded="2xl" p="6" shadow="md">
  <p m="0" text="primary" font-size="xs" font-weight="700">STARTER</p>
  <p m="0" mt="2" font-size="4xl" font-weight="700">$19<span text="muted" font-size="sm" font-weight="400">/mo</span></p>
  <p m="0" mt="2" text="muted" font-size="sm">For side projects and solo builders.</p>
  <button type="button" mt="5" w="full" bg="primary" hover-bg="primary/80" text="white" border="0" py="2.5" rounded="full" font-weight="600" cursor="pointer">Choose plan</button>
</div>`, { featured: true }),

  mk('Cards', 'Stat', 'Single metric with a trend chip.', ['card', 'stat', 'dashboard'], `
<div w="full" max-w="16rem" bg="#fff" dark-bg="#17181b" border="1px solid gray-200" dark-border-color="#ffffff/10" rounded="2xl" p="5">
  <div display="flex" items="center" justify="between"><span text="muted" font-size="sm">Revenue</span><span bg="success/10" text="success" rounded="full" px="2" py="0.5" font-size="xs" font-weight="600">+12.8%</span></div>
  <p m="0" mt="3" font-size="4xl" font-weight="700" tracking="tight">$128.4K</p>
  <p m="0" mt="1" text="muted" font-size="xs">vs. last month</p>
</div>`),

  mk('Cards', 'Product', 'Image area, title, price and add-to-cart.', ['card', 'product', 'ecommerce'], `
<div w="full" max-w="16rem" bg="#fff" dark-bg="#17181b" border="1px solid gray-200" dark-border-color="#ffffff/10" rounded="2xl" overflow="hidden">
  <div h="36" bg-gradient="linear-gradient(135deg,#fde68a,#fb923c)" display="flex" items="center" justify="center" text="white" font-size="4xl"><i class="ri-headphone-line"></i></div>
  <div p="4">
    <h3 m="0" font-size="base">Studio Headphones</h3>
    <p m="0" mt="1" text="muted" font-size="sm">Wireless, 40h battery</p>
    <div display="flex" items="center" justify="between" mt="4"><b font-size="lg">$149</b><button type="button" bg="primary" hover-bg="primary/80" text="white" border="0" px="3" py="2" rounded="lg" font-size="sm" font-weight="600" cursor="pointer">Add</button></div>
  </div>
</div>`),

  mk('Forms', 'Login', 'Email and password with a primary submit.', ['form', 'login', 'auth'], `
<div w="full" max-w="20rem" display="grid" gap="4" bg="#fff" dark-bg="#17181b" border="1px solid gray-200" dark-border-color="#ffffff/10" rounded="2xl" p="6" shadow="md">
  <h3 m="0" font-size="xl">Welcome back</h3>
  <label display="grid" gap="1.5" font-size="sm" font-weight="600">Email<input type="email" placeholder="you@company.com" bg="#fff" dark-bg="#0b0c0e" text="text" border="1px solid gray-300" dark-border-color="#ffffff/15" rounded="lg" px="3" py="2.5"></label>
  <label display="grid" gap="1.5" font-size="sm" font-weight="600">Password<input type="password" placeholder="••••••••" bg="#fff" dark-bg="#0b0c0e" text="text" border="1px solid gray-300" dark-border-color="#ffffff/15" rounded="lg" px="3" py="2.5"></label>
  <button type="button" bg="primary" hover-bg="primary/80" text="white" border="0" py="2.5" rounded="lg" font-weight="600" cursor="pointer">Sign in</button>
</div>`),

  mk('Forms', 'Search Input', 'Search field with icon and keyboard hint.', ['form', 'input', 'search'], `
<div w="full" max-w="22rem" display="flex" items="center" gap="3" bg="#fff" dark-bg="#101113" border="1px solid gray-200" dark-border-color="#ffffff/10" rounded="2xl" px="4" py="3" shadow="lg">
  <i class="ri-search-line" text="muted" font-size="xl"></i>
  <input type="search" placeholder="Search…" aria-label="Search" bg="transparent" border="0" text="text" flex="1" w="full">
  <kbd bg="gray-100" dark-bg="#ffffff/10" text="muted" rounded="md" px="2" py="0.5" font-size="xs" font-weight="600">/</kbd>
</div>`),

  mk('Forms', 'Native Controls', 'Checkbox, radio and range tinted with accent-color.', ['form', 'checkbox', 'range'], `
<div display="grid" gap="4" w="full" max-w="18rem" text="text">
  <label display="flex" items="center" gap="3"><input type="checkbox" checked accent-color="primary"> Email me product updates</label>
  <label display="flex" items="center" gap="3"><input type="radio" name="plan" checked accent-color="primary"> Monthly billing</label>
  <label display="flex" items="center" gap="3"><input type="radio" name="plan" accent-color="primary"> Yearly billing</label>
  <label display="grid" gap="2" font-size="sm">Volume<input type="range" accent-color="primary"></label>
</div>`),

  mk('Feedback', 'Alerts', 'Info, success, warning and danger messages.', ['alert', 'feedback', 'status'], `
<div display="grid" gap="3" w="full" max-w="26rem" font-size="sm">
  <div display="flex" gap="3" bg="primary/10" border="1px solid primary/20" text="primary" rounded="xl" p="3"><i class="ri-information-line"></i>New version available.</div>
  <div display="flex" gap="3" bg="success/10" border="1px solid success/20" text="success" rounded="xl" p="3"><i class="ri-checkbox-circle-line"></i>Changes saved.</div>
  <div display="flex" gap="3" bg="warning/10" border="1px solid warning/20" text="warning" rounded="xl" p="3"><i class="ri-alert-line"></i>Storage almost full.</div>
  <div display="flex" gap="3" bg="danger/10" border="1px solid danger/20" text="danger" rounded="xl" p="3"><i class="ri-close-circle-line"></i>Payment failed.</div>
</div>`),

  mk('Feedback', 'Badges', 'Small status labels in solid, soft and outline styles.', ['badge', 'feedback', 'label'], `
<div display="flex" wrap gap="2" justify="center" font-size="xs" font-weight="600">
  <span bg="primary" text="white" rounded="full" px="3" py="1">New</span>
  <span bg="success/10" text="success" rounded="full" px="3" py="1">Active</span>
  <span bg="warning/10" text="warning" rounded="full" px="3" py="1">Pending</span>
  <span bg="danger/10" text="danger" rounded="full" px="3" py="1">Failed</span>
  <span border="1px solid gray-300" dark-border-color="#ffffff/20" text="muted" rounded="full" px="3" py="1">Draft</span>
</div>`),
];

/* ============================ SECTIONS ============================ */
const sections = [
  mk('Sections', 'Hero Centered', 'Badge, headline, supporting copy and two actions.', ['section', 'hero', 'landing'], `
<section align="center" px="6" py="20" bg="#fff" dark-bg="gray-950">
  <span display="inline-block" bg="primary/10" text="primary" border="1px solid primary/20" rounded="full" px="3" py="1" font-size="xs" font-weight="600">New: Version 2.0</span>
  <h1 m="0" mt="6" mb="4" font-size="5xl" font-weight="700" tracking="tight" line-height="tight">Ship interfaces faster.</h1>
  <p m="0" mx="auto" max-w="xl" text="muted" font-size="lg" line-height="relaxed">Describe the design in attributes and watch it render. No build step, no stylesheet to maintain.</p>
  <div display="flex" justify="center" gap="3" mt="8">
    <a href="#" bg="primary" hover-bg="primary/80" text="white" px="6" py="3" rounded="lg" font-weight="600" text-decoration="none">Get started</a>
    <a href="#" border="1px solid gray-300" dark-border-color="#ffffff/20" text="text" px="6" py="3" rounded="lg" font-weight="600" text-decoration="none">Read the docs</a>
  </div>
</section>`, { featured: true }),

  mk('Sections', 'Feature Grid', 'Three feature cards with icons.', ['section', 'features', 'grid'], `
<section px="6" py="16" bg="gray-50" dark-bg="#090a0c">
  <h2 align="center" m="0" mb="10" font-size="3xl" font-weight="700" tracking="tight">Everything a page needs</h2>
  <div display="grid" grid-cols="3" gap="5" max-w="5xl" mx="auto">
    <div bg="#fff" dark-bg="#0e0f11" border="1px solid gray-200" dark-border-color="#ffffff/10" rounded="2xl" p="6"><span w="11" h="11" rounded="xl" bg="primary/10" text="primary" display="flex" items="center" justify="center" font-size="xl"><i class="ri-flashlight-line"></i></span><h3 m="0" mt="4" mb="2" font-size="lg">Fast</h3><p m="0" text="muted" font-size="sm" line-height="relaxed">Rules are generated at runtime, only for what you use.</p></div>
    <div bg="#fff" dark-bg="#0e0f11" border="1px solid gray-200" dark-border-color="#ffffff/10" rounded="2xl" p="6"><span w="11" h="11" rounded="xl" bg="success/10" text="success" display="flex" items="center" justify="center" font-size="xl"><i class="ri-contrast-fill"></i></span><h3 m="0" mt="4" mb="2" font-size="lg">Dark mode</h3><p m="0" text="muted" font-size="sm" line-height="relaxed">Light and dark intent sit side by side on one element.</p></div>
    <div bg="#fff" dark-bg="#0e0f11" border="1px solid gray-200" dark-border-color="#ffffff/10" rounded="2xl" p="6"><span w="11" h="11" rounded="xl" bg="warning/10" text="warning" display="flex" items="center" justify="center" font-size="xl"><i class="ri-smartphone-line"></i></span><h3 m="0" mt="4" mb="2" font-size="lg">Responsive</h3><p m="0" text="muted" font-size="sm" line-height="relaxed">Breakpoint prefixes live next to the base value.</p></div>
  </div>
</section>`),

  mk('Sections', 'CTA Band', 'Gradient call-to-action banner.', ['section', 'cta', 'banner'], `
<section px="6" py="14" bg="#fff" dark-bg="gray-950">
  <div max-w="4xl" mx="auto" align="center" rounded="3xl" px="8" py="12" bg-gradient="linear-gradient(135deg,#5b5cf6,#a78bfa)">
    <h2 m="0" mb="3" text="white" font-size="3xl" font-weight="700" tracking="tight">Made something worth sharing?</h2>
    <p m="0" mb="6" text="#fff/80">Submit it to the library and keep your name on it.</p>
    <a href="#" bg="white" text="#4338ca" px="6" py="3" rounded="full" font-weight="600" text-decoration="none">Contribute a design</a>
  </div>
</section>`, { frame: { w: 1000, h: 380 } }),
];

export const catalogCategories = ['Navbars', 'Buttons', 'Cards', 'Forms', 'Feedback', 'Sections', 'Templates'];
export const catalogItems = [...navbars, ...buttons, ...others, ...sections];