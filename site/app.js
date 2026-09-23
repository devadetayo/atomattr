const {
  refreshAtomAttr,
  startAtomAttr,
  DICTIONARY,
  BREAKPOINTS,
  COLORS,
  FONT_SIZE_SCALE,
  LINE_HEIGHT,
  LETTER_SPACING,
  PSEUDO_STATES,
  RADIUS_SCALE,
  SEMANTIC_COLORS,
  SHADOW_PRESETS,
  SPACING_SCALE,
  VALUE_ALIASES,
} = window.AtomAttr;

const STORAGE_KEY = 'atomattr-theme';

const PLAYGROUND_TEMPLATES = {
  html: {
    label: 'HTML',
    title: 'Plain HTML snippet',
    helper:
      'Edit the HTML and click Run. The preview iframe loads AtomAttr from this project and applies your attributes live.',
    code: `<section p="8" bg="slate-950" text="white" rounded="3xl" shadow="2xl">
  <p font-size="sm" tracking="widest" text="slate-400">HELLO</p>
  <h1 mt="2" font-size="4xl" weight="black">Build with attributes</h1>
  <p mt="3" text="slate-300">
    AtomAttr compiles only the rules you actually use.
  </p>
  <div mt="6" flex gap="3" wrap>
    <button px="4" py="2" rounded="full" bg="brand-light" text="slate-950">
      Launch
    </button>
    <span px="4" py="2" rounded="full" bg="slate-800" text="slate-200">
      No classes
    </span>
  </div>
</section>`,
  },
  react: {
    label: 'React',
    title: 'React component',
    helper:
      'This mode gives you React starter code. The live preview renders the HTML-equivalent output so users still get immediate visual feedback.',
    code: `import { Box, H1, Txt, Btn, Row, Badge } from 'atomattr/react';

export function HeroCard() {
  return (
    <Box bg="slate-950" text="white" p="8" rounded="3xl" shadow="2xl">
      <Badge bg="brand-light" text="slate-950">React</Badge>
      <H1 mt="4" fontSize="4xl" weight="black">
        Build with the same AtomAttr contract
      </H1>
      <Txt mt="3" text="slate-300">
        React aliases normalize back into canonical HTML attributes.
      </Txt>
      <Row mt="6" gap="3" wrap>
        <Btn px="4" py="2" rounded="full" bg="brand-light" text="slate-950">
          Launch
        </Btn>
        <Txt px="4" py="2" rounded="full" bg="slate-800" text="slate-200" as="span">
          Same API
        </Txt>
      </Row>
    </Box>
  );
}`,
    previewHtml: `<section p="8" bg="slate-950" text="white" rounded="3xl" shadow="2xl">
  <span inline-flex items="center" rounded="full" px="3" py="1" font-size="xs" weight="semibold" bg="brand-light" text="slate-950">
    React
  </span>
  <h1 mt="4" font-size="4xl" weight="black">Build with the same AtomAttr contract</h1>
  <p mt="3" text="slate-300">React aliases normalize back into canonical HTML attributes.</p>
  <div mt="6" flex gap="3" wrap>
    <button px="4" py="2" rounded="full" bg="brand-light" text="slate-950">Launch</button>
    <span px="4" py="2" rounded="full" bg="slate-800" text="slate-200">Same API</span>
  </div>
</section>`,
  },
  vite: {
    label: 'Vite',
    title: 'Vite setup starter',
    helper:
      'This gives users the install and bootstrapping flow for a Vite app. The preview renders the same AtomAttr UI the starter is meant to produce.',
    code: `npm install atomattr react react-dom

// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { startAtomAttr } from 'atomattr';
import { Box, H1, Txt } from 'atomattr/react';
import 'atomattr/defaults.css';

startAtomAttr();

function App() {
  return (
    <Box minH="screen" bg="slate-950" text="white" p="8">
      <H1 fontSize="4xl" weight="black">AtomAttr + Vite</H1>
      <Txt mt="3" text="slate-300">
        Zero class strings. One shared contract.
      </Txt>
    </Box>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);`,
    previewHtml: `<main min-h="screen" bg="slate-950" text="white" p="8">
  <h1 font-size="4xl" weight="black">AtomAttr + Vite</h1>
  <p mt="3" text="slate-300">Zero class strings. One shared contract.</p>
</main>`,
  },
};

startAtomAttr();

function getThemeButtonMarkup(theme) {
  const isDark = theme === 'dark';

  return `
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      style="display:block;"
    >
      ${isDark
        ? `
          <path d="M12 3v2.5M12 18.5V21M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M3 12h2.5M18.5 12H21M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
          <circle cx="12" cy="12" r="4.2" />
        `
        : `
          <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a8 8 0 1 0 9.5 9.5Z" />
        `
      }
    </svg>
  `;
}

function setLogoSources() {
  document.querySelectorAll('[data-logo]').forEach(image => {
    image.src = `${getRelativeRoot()}assets/images/logo.png`;
  });
}

function applyTheme(theme) {
  const html = document.documentElement;
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  html.classList.toggle('dark', nextTheme === 'dark');
  localStorage.setItem(STORAGE_KEY, nextTheme);

  // Also ensure highlight.js theme links follow the selected theme so
  // syntax highlighting updates immediately on toggle.
  const hljsLight = document.getElementById('hljs-light');
  const hljsDark = document.getElementById('hljs-dark');
  if (hljsLight && hljsDark) {
    hljsLight.media = nextTheme === 'light' ? 'all' : 'not all';
    hljsDark.media = nextTheme === 'dark' ? 'all' : 'not all';
    try { sessionStorage.setItem('atomattr:theme', nextTheme); } catch (e) {}
  }

  document.querySelectorAll('[data-theme-toggle]').forEach(button => {
    button.setAttribute('aria-label', nextTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    button.setAttribute('title', nextTheme === 'dark' ? 'Light theme' : 'Dark theme');
    button.innerHTML = getThemeButtonMarkup(nextTheme);
  });
}

function setupTheme() {
  const stored = localStorage.getItem(STORAGE_KEY) || 'light';
  applyTheme(stored);

  // Support both header toggles and playground-specific color toggle
  document.querySelectorAll('[data-theme-toggle], [data-color-toggle]').forEach(button => {
    button.addEventListener('click', () => {
      const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
      applyTheme(next);
      refreshAtomAttr(document.body);
    });
  });
}

function setupNavigation() {
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav-link]').forEach(link => {
    const target = link.getAttribute('href') || '';
    if (target === current || (current === '' && target === 'index.html')) {
      link.classList.add('is-current');
    }
  });
}

function getRelativeRoot() {
  return location.pathname.includes('/docs/') ? '../' : '';
}

function setupSiteNav() {
  document.querySelectorAll('[data-site-nav]').forEach(mount => {
    const root = getRelativeRoot();
    const current = location.pathname.split('/').pop() || 'index.html';
    const links = [
      ['Features', `${root}index.html#features`, 'features'],
      ['Docs', `${root}docs.html`, 'docs'],
      ['Search', `${root}search.html`, 'search'],
      ['Playground', `${root}playground.html`, 'playground'],
      ['Community', `${root}index.html#community`, 'community'],
    ];

    mount.innerHTML = `
        <nav mx="auto" px="4" lg-px="6" xl-px="6" py="2" display="flex" items="center" justify="between" gap="6" bg="white/40" dark-bg="gray-950/40" border="1px" border-color="gray-200/60" dark-border-color="gray-800/60" rounded="full" shadow="lg" backdrop-blur="8px">
          <a href="${root}index.html" display="flex" items="center" gap="2.5" text="text" text-decoration="none" font-weight="bold" font-size="lg">
            <img src="${root}assets/images/logo.png" alt="Atomattr" h="6" dark-display="none" display="flex">
            <img src="${root}assets/images/logo.dark.png" alt="Atomattr" h="6" dark-display="flex" display="none">
          </a>

          <div id="main-nav" display="none" fixed md-relative top="0" left="0" bg="#fff" dark-bg="gray-950" md-bg="transparent" md-dark-bg="transparent" md-display="flex" flex-col md-flex-row items="center" gap="6" w="full" md-w="auto" order="3" md-order="0" pt="4" md-pt="0" mt="16" md-mt="0" border-t="border" md-border="0">
            ${links.map(([label, href, key]) => {
              const active =
                (key === 'docs' && (current === 'docs.html' || location.pathname.includes('/docs/'))) ||
                (key === 'search' && current === 'search.html') ||
                (key === 'playground' && current === 'playground.html');
              return `<a href="${href}" data-nav-link text="${active ? 'primary' : 'muted'}" text-decoration="none" font-weight="${active ? '600' : '500'}">${label}</a>`;
            }).join('')}
            <div display="flex" md-display="none" items="center" gap="2" pt="2">
              <a href="${root}index.html#community" aria-label="Open Discord community" display="flex" items="center" justify="center" w="10" h="10" rounded="lg" text="text" text-decoration="none" border="border">
                <i class="ri-discord-fill" font-size="20" color="indigo-500"></i>
              </a>
              <a href="${root}support.html" aria-label="Open voice chat support" display="flex" items="center" justify="center" w="10" h="10" rounded="lg" text="text" text-decoration="none" border="border">
                <i class="ri-github-fill" font-size="20"></i>
              </a>
            </div>
          </div>

          <div display="flex" items="center" gap="2">
            <a href="${root}index.html#community" aria-label="Open Discord community" display="none" md-display="flex" items="center" justify="center" w="10" h="10" rounded="lg" text="text" text-decoration="none" hover-bg="primary/10">
              <i class="ri-discord-fill" font-size="20" color="indigo-500"></i>
            </a>
            <a href="${root}support.html" aria-label="Open voice chat support" display="none" md-display="flex" items="center" justify="center" w="10" h="10" rounded="lg" text="text" dark-text="#fff" text-decoration="none" hover-bg="primary/10">
              <i class="ri-github-fill" font-size="20"></i>
            </a>
           <button type="button" aria-label="Toggle color theme" data-theme-toggle bg="transparent" text="text" dark-text="#fff" p="3" rounded="lg" display="flex" items="center" justify="center" border="none">
              <i class="ri-moon-line" font-size="20"></i>
            </button>
            <button type="button" aria-label="Open navigation" aria-expanded="false" data-mobile-toggle="main-nav" display="flex" md-display="none" bg="transparent" text="text" dark-text="#fff" p="3" rounded="lg" items="center" justify="center" border="none">
              <i class="ri-menu-line" font-size="24" data-mobile-toggle-icon></i>
            </button>
          </div>
        </nav>
    `;
  });
}

function setupMobileNav() {
  document.querySelectorAll('button[data-mobile-toggle]').forEach(toggle => {
    const targetId = toggle.getAttribute('data-mobile-toggle');
    const target = document.getElementById(targetId);
    if (!target) return;
    const icon = toggle.querySelector('[data-mobile-toggle-icon]');

    function setOpen(open) {
      target.style.display = open ? 'flex' : '';
      target.setAttribute('data-open', open ? 'true' : 'false');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      if (icon) {
        icon.className = open ? 'ri-close-line' : 'ri-menu-line';
      }
    }

    toggle.addEventListener('click', () => {
      const isOpen = target.style.display === 'flex' || target.getAttribute('data-open') === 'true';
      setOpen(!isOpen);
    });

    target.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        if (window.innerWidth < 768) {
          setOpen(false);
        }
      });
    });
  });
}

function setupScrollNavigation() {
  const navigationShells = document.querySelectorAll('[data-site-nav], .site-header');
  if (!navigationShells.length) return;

  const update = () => {
    const isScrolled = window.scrollY > 12;
    navigationShells.forEach(shell => shell.classList.toggle('is-scrolled', isScrolled));
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
}

function setupCopyButtons() {
  document.querySelectorAll('[data-copy-target]').forEach(button => {
    button.addEventListener('click', async () => {
      const target = document.getElementById(button.getAttribute('data-copy-target'));
      if (!target) return;

      const text = target.textContent || '';
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = 'Copied';
      } catch {
        button.textContent = 'Copy failed';
      }

      window.setTimeout(() => {
        button.textContent = button.getAttribute('data-copy-label') || 'Copy';
      }, 1400);
    });
  });
}

function setupDocsSidebar() {
  const currentPage = location.pathname.split('/').pop() || 'docs.html';
  document.querySelectorAll('[data-doc-page-link]').forEach(link => {
    const target = (link.getAttribute('href') || '').split('#')[0].split('/').pop();
    const isCurrent = target === currentPage || (currentPage === '' && target === 'docs.html');
    link.classList.toggle('is-active', isCurrent);
    if (isCurrent) {
      link.setAttribute('aria-current', 'page');
      link.setAttribute('text', 'primary');
      link.setAttribute('bg', 'primary/10');
      link.setAttribute('font-weight', '600');
      link.scrollIntoView({ block: 'nearest' });
    }
  });

  const links = [...document.querySelectorAll('[data-doc-link], [data-toc-link]')];
  const sections = links
    .map(link => {
      const id = link.getAttribute('href')?.slice(1);
      return id ? document.getElementById(id) : null;
    })
    .filter(Boolean);

  if (!links.length || !sections.length) return;

  function setActive(id) {
    links.forEach(link => {
      const active = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', active);
      link.setAttribute('text', active ? 'primary' : 'muted');
      link.setAttribute('font-weight', active ? '600' : '400');
    });
  }

  function updateActiveSection() {
    const offset = 150;
    let active = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= offset) active = section;
    }
    if (active) setActive(active.id);
  }

  window.addEventListener('scroll', updateActiveSection, { passive: true });
  window.addEventListener('resize', updateActiveSection);
  updateActiveSection();
}

function buildSearchIndex() {
  const record = (type, label, detail, example, href, score = 0) => ({ type, label, detail, example, href, score });
  const entries = Array.isArray(window.ATOMATTR_DOCS_SEARCH_PAGES)
    ? window.ATOMATTR_DOCS_SEARCH_PAGES.map(entry =>
        record(entry.type || 'page', entry.label, entry.detail, 'Open docs page', entry.href, 0)
      )
    : [];

  Object.keys(DICTIONARY).sort().forEach(key => {
    const cssProp = Array.isArray(DICTIONARY[key]) ? DICTIONARY[key].join(', ') : DICTIONARY[key];
    const example = `${key}="${key === 'bg' ? 'primary' : key === 'p' ? '6' : key === 'rounded' ? 'xl' : 'value'}"`;
    entries.push(record('attribute', key, String(cssProp), example, '/docs/cheatsheet.html#all-attributes', key.length));
  });

  const valueBuckets = [
    ['spacing', SPACING_SCALE],
    ['color', { ...SEMANTIC_COLORS, ...COLORS }],
    ['radius', RADIUS_SCALE],
    ['font-size', FONT_SIZE_SCALE],
    ['line-height', LINE_HEIGHT],
    ['letter-spacing', LETTER_SPACING],
    ['shadow', SHADOW_PRESETS],
    ['breakpoint', BREAKPOINTS],
    ['state prefix', Object.fromEntries(PSEUDO_STATES.map(state => [state, `:${state}`]))],
    ['syntax prefix', {
      dark: 'dark mode selector',
      'group-hover': 'group hover selector',
      before: '::before pseudo-element',
      after: '::after pseudo-element',
    }],
    ['alias', VALUE_ALIASES],
  ];

  valueBuckets.forEach(([group, values]) => {
    Object.entries(values).forEach(([name, value]) => {
      const href = group === 'breakpoint'
        ? '/docs/responsive.html#breakpoints'
        : group === 'state prefix'
          ? '/docs/states.html#interactive'
          : group === 'syntax prefix'
            ? '/docs/syntax.html#prefixes'
        : group === 'color'
          ? '/docs/colors-backgrounds.html#attributes'
          : '/docs/values.html#scale-values';
      const example = group === 'color'
        ? `bg="${name}"`
        : group === 'breakpoint'
          ? `${name}-p="6"`
          : group === 'state prefix'
            ? `${name}-bg="primary/10"`
            : group === 'syntax prefix'
              ? `${name}-bg="gray-900"`
          : `value="${name}"`;
      entries.push(record('value', name, `${group}: ${value}`, example, href, 0));
    });
  });

  return entries;
}

function setupSearchPage() {
  const root = document.querySelector('[data-search-page]');
  if (!root) return;

  const input = document.getElementById('attribute-search');
  const results = document.getElementById('search-results');
  const emptyState = document.getElementById('search-empty');
  const total = document.getElementById('search-total');
  if (!input || !results || !emptyState || !total) return;

  const entries = buildSearchIndex ();

  const renderResults = query => {
    const q = String(query || '').trim().toLowerCase();
    const matches = entries.filter(entry => {
      if (!q) return true;
      const haystack = `${entry.label} ${entry.detail} ${entry.type} ${entry.example}`.toLowerCase();
      return haystack.includes(q);
    });

    const visible = matches.slice(0, 120);
    results.innerHTML = '';

    if (!visible.length) {
      emptyState.hidden = false;
      total.textContent = '0 matches';
      return;
    }

    emptyState.hidden = true;
    total.textContent = `${visible.length} match${visible.length === 1 ? '' : 'es'}`;

    visible.forEach(entry => {
      const item = document.createElement(entry.href ? 'a' : 'article');
      if (entry.href) {
        item.href = entry.href;
        item.setAttribute('text-decoration', 'none');
        item.setAttribute('text', 'text');
      }
      item.setAttribute('bg', 'gray-50');
      item.setAttribute('dark-bg', 'gray-900');
      item.setAttribute('border', 'border');
      item.setAttribute('rounded', '2xl');
      item.setAttribute('p', '4');
      item.setAttribute('display', 'flex');
      item.setAttribute('flex-col', '');
      item.setAttribute('gap', '2');
      item.setAttribute('hover-bg', 'primary/10');

      const badge = document.createElement('span');
      badge.setAttribute('display', 'inline-flex');
      badge.setAttribute('w', 'fit');
      badge.setAttribute('px', '2');
      badge.setAttribute('py', '1');
      badge.setAttribute('rounded', 'full');
      badge.setAttribute('bg', entry.type === 'attribute' ? 'primary/10' : entry.type === 'value' ? 'success/10' : 'warning/10');
      badge.setAttribute('text', entry.type === 'attribute' ? 'primary' : entry.type === 'value' ? 'success' : 'warning');
      badge.setAttribute('font-size', 'xs');
      badge.setAttribute('font-weight', '700');
      badge.textContent = entry.type.replace('-', ' ');

      const name = document.createElement('strong');
      name.setAttribute('font-size', 'lg');
      name.setAttribute('font-weight', '700');
      name.textContent = entry.label;

      const detail = document.createElement('p');
      detail.setAttribute('text', 'muted');
      detail.setAttribute('font-size', 'sm');
      detail.setAttribute('line-height', 'relaxed');
      detail.textContent = entry.detail;

      const exampleNode = document.createElement('code');
      exampleNode.setAttribute('bg', 'gray-100');
      exampleNode.setAttribute('dark-bg', 'gray-800');
      exampleNode.setAttribute('rounded', 'md');
      exampleNode.setAttribute('px', '2');
      exampleNode.setAttribute('py', '1');
      exampleNode.setAttribute('font-size', 'sm');
      exampleNode.textContent = entry.example;

      item.appendChild(badge);
      item.appendChild(name);
      item.appendChild(detail);
      item.appendChild(exampleNode);

      if (entry.href) {
        const open = document.createElement('span');
        open.setAttribute('display', 'inline-flex');
        open.setAttribute('items', 'center');
        open.setAttribute('gap', '1');
        open.setAttribute('text', 'primary');
        open.setAttribute('font-size', 'sm');
        open.setAttribute('font-weight', '700');
        open.innerHTML = 'Open <i class="ri-arrow-right-line"></i>';
        item.appendChild(open);
      }
      results.appendChild(item);
    });
  };

  input.addEventListener('input', event => {
    renderResults(event.target.value);
  });

  renderResults('');
}

function buildPreviewDocument(markup) {
  const baseHref = new URL('./', window.location.href).href;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <base href="${baseHref}" />
    <link rel="stylesheet" href="./src/style-data/defaults.css" />
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        background: linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%);
        color: #10233f;
        font-family: "Sora", system-ui, sans-serif;
      }
      main {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 1.5rem;
      }
    </style>
  </head>
  <body>
    <main>${markup}</main>
    <script type="module">
      import { startAtomAttr } from './src/index.js';
      startAtomAttr();
    </script>
  </body>
</html>`;
}

function setupPlayground() {
  const root = document.querySelector('[data-playground]');
  if (!root) return;

  const editor = document.getElementById('playground-editor');
  const helper = document.getElementById('playground-helper');
  const title = document.getElementById('playground-title');
  const iframe = document.getElementById('playground-preview');
  const buttons = [...document.querySelectorAll('[data-language]')];
  const resetButton = document.getElementById('playground-reset');
  const runButton = document.getElementById('playground-run');
  const modeNote = document.getElementById('playground-note');

  if (!editor || !helper || !title || !iframe || !buttons.length || !resetButton || !runButton || !modeNote) {
    return;
  }

  let mode = 'html';

  const render = () => {
    const template = PLAYGROUND_TEMPLATES[mode];
    title.textContent = template.title;
    helper.textContent = template.helper;
    modeNote.textContent =
      mode === 'html'
        ? 'Live preview reflects your current editor content.'
        : 'Preview uses the HTML-equivalent output while the editor shows the selected framework starter.';
    iframe.srcdoc = buildPreviewDocument(mode === 'html' ? editor.value : template.previewHtml);
    buttons.forEach(button => {
      button.classList.toggle('is-active', button.getAttribute('data-language') === mode);
    });
  };

  const setMode = nextMode => {
    mode = nextMode;
    const template = PLAYGROUND_TEMPLATES[mode];
    editor.value = template.code;
    render();
  };

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      setMode(button.getAttribute('data-language'));
    });
  });

  resetButton.addEventListener('click', () => {
    editor.value = PLAYGROUND_TEMPLATES[mode].code;
    render();
  });

  runButton.addEventListener('click', render);

  editor.addEventListener('input', () => {
    if (mode === 'html') render();
  });

  setMode('html');
}

if (typeof document !== 'undefined') {
  setLogoSources();
  setupSiteNav();
  setupScrollNavigation();
  setupTheme();
  setupNavigation();
  setupMobileNav();
  setupCopyButtons();
  setupDocsSidebar();
  setupPlayground();
  setupSearchPage();
  refreshAtomAttr(document.body);
}

(function () {
  try {
    const root = document.documentElement;
    const toggle = document.querySelector('button[aria-label="Toggle color theme"]');
    if (!toggle) return;

    function systemPrefersDark() {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    const hljsLight = document.getElementById('hljs-light');
    const hljsDark = document.getElementById('hljs-dark');

    function applyTheme(t) {
      root.dataset.theme = t;
      if (t === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
      if (hljsLight && hljsDark) {
        hljsLight.media = t === 'light' ? 'all' : 'not all';
        hljsDark.media = t === 'dark' ? 'all' : 'not all';
      }
      try { sessionStorage.setItem('atomattr:theme', t); } catch (e) {}
    }

    let stored;
    try { stored = sessionStorage.getItem('atomattr:theme'); } catch (e) {}
    if (stored === 'dark' || stored === 'light') applyTheme(stored);

    toggle.addEventListener('click', () => {
      const current = root.dataset.theme === 'dark' || (!root.dataset.theme && systemPrefersDark());
      applyTheme(current ? 'light' : 'dark');
    });
  } catch (e) {}
})();
