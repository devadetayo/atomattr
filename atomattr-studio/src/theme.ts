/* ---------- glass recipe ----------
   Surfaces are defined by tone, not outlines: a translucent fill, restrained blur, a faint inner top-light and a soft shadow.
   Borders keep their 1px width (so layout never shifts) but are transparent. Accent borders (focus, selection, drop targets) are untouched. */
const BLUR = { 'backdrop-blur': '18px', 'backdrop-saturate': '130' } as const;
const NO_EDGE = { border: '1px solid', 'border-color': 'transparent', 'dark-border-color': 'transparent' } as const;
const SHADOW = {
  /** Flush bars and docked columns: only the inner top-light, no cast shadow. */
  flush: { shadow: 'inset 0 1px 0 rgba(255,255,255,0.7)', 'dark-shadow': 'inset 0 1px 0 rgba(255,255,255,0.045)' },
  /** Floating panels over the canvas. */
  float: {
    shadow: 'inset 0 1px 0 rgba(255,255,255,0.75), 0 0 0 1px rgba(15,23,42,0.05), 0 12px 32px -10px rgba(15,23,42,0.22), 0 2px 6px rgba(15,23,42,0.06)',
    'dark-shadow': 'inset 0 1px 0 rgba(255,255,255,0.07), inset 0 0 0 1px rgba(255,255,255,0.035), 0 14px 36px -10px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.28)',
  },
  /** Menus, popovers and dialogs: a little deeper so they read as the top layer. */
  pop: {
    shadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 0 0 1px rgba(15,23,42,0.06), 0 18px 44px -12px rgba(15,23,42,0.30), 0 3px 10px rgba(15,23,42,0.08)',
    'dark-shadow': 'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.04), 0 22px 54px -12px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.35)',
  },
} as const;

/** Frosted dialog / toast recipe: denser than a panel so text stays crisp over busy content, with a visible glass edge. */
const GLASS_EDGE = { border: '1px solid', 'border-color': 'white/65', 'dark-border-color': 'white/10' } as const;
const GLASS_BLUR = { 'backdrop-blur': '26px', 'backdrop-saturate': '165' } as const;

/**
 * Central design tokens. These are AtomAttr attribute presets, spread onto components: <Box {...T.panel} />.
 * There is no CSS anywhere in the Studio; light and dark come from the `dark-` attribute prefix.
 */
export const T = {
  app: { bg: 'gray-100', 'dark-bg': 'gray-950', text: 'gray-800', 'dark-text': 'gray-100' },
  /** Flush chrome (top bar, docked columns, rails, code panel): a quiet frosted tone, no outline. No blur and no border width here: it sits on the opaque backdrop (nothing to blur), blur would trap child menus in a stacking context, and callers choose which sides get a border. */
  chrome: { bg: 'white/72', 'dark-bg': 'gray-900/78', 'border-color': 'transparent', 'dark-border-color': 'transparent', ...SHADOW.flush },
  /** Popovers, menus, dialogs and the command palette: dense glass so text stays crisp over any design. */
  panel: { bg: 'white/82', 'dark-bg': 'gray-900/88', ...BLUR, ...NO_EDGE, ...SHADOW.pop, rounded: 'md' },
  /** Floating surfaces (panels over the canvas, the palette, zoom, pages): see-through with a blur behind, so the design shows through. */
  glass: { bg: 'white/62', 'dark-bg': 'gray-900/62', ...BLUR, ...NO_EDGE, ...SHADOW.float, rounded: 'md' },
  /** Menus and popovers that open from a floating surface: the same glass, a little denser so the text stays easy to read. */
  glassPop: { bg: 'white/80', 'dark-bg': 'gray-900/86', ...BLUR, ...NO_EDGE, ...SHADOW.pop, rounded: 'md' },
  /** A panel being dragged: lifted a little higher. */
  lifted: { 'dark-shadow': 'inset 0 1px 0 rgba(255,255,255,0.09), 0 28px 64px -12px rgba(0,0,0,0.75), 0 6px 16px rgba(0,0,0,0.4)', shadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 28px 60px -14px rgba(15,23,42,0.38), 0 6px 14px rgba(15,23,42,0.12)' },
  /** Dialogs (confirm, delete, input, what's new, new project): frosted glass with a lit edge, the deepest shadow in the interface. */
  dialog: { bg: 'white/72', 'dark-bg': 'gray-900/74', ...GLASS_BLUR, ...GLASS_EDGE, rounded: '14px',
    shadow: 'inset 0 1px 0 rgba(255,255,255,0.85), 0 28px 70px -16px rgba(15,23,42,0.42), 0 6px 18px rgba(15,23,42,0.12)',
    'dark-shadow': 'inset 0 1px 0 rgba(255,255,255,0.09), 0 32px 80px -16px rgba(0,0,0,0.8), 0 6px 20px rgba(0,0,0,0.4)' },
  /** Toast: the same glass, lighter and smaller. Errors are tinted red but stay see-through. */
  toast: { bg: 'white/70', 'dark-bg': 'gray-900/72', ...GLASS_BLUR, ...GLASS_EDGE, rounded: '12px', text: 'gray-800', 'dark-text': 'gray-100',
    shadow: 'inset 0 1px 0 rgba(255,255,255,0.85), 0 16px 40px -12px rgba(15,23,42,0.34), 0 3px 10px rgba(15,23,42,0.1)',
    'dark-shadow': 'inset 0 1px 0 rgba(255,255,255,0.09), 0 18px 44px -12px rgba(0,0,0,0.7), 0 3px 12px rgba(0,0,0,0.35)' },
  toastError: { bg: 'danger/16', 'dark-bg': 'danger/22', 'border-color': 'danger/40', 'dark-border-color': 'danger/45' },
  /** Clean content card: a quiet raised surface with a hairline edge. Hover lifts it slightly (motion lives in styles.css under [data-tile]). */
  tile: { bg: 'white/62', 'dark-bg': 'white/5', border: '1px solid', 'border-color': 'gray-900/8', 'dark-border-color': 'white/9', rounded: '12px',
    shadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 2px rgba(15,23,42,0.05)', 'dark-shadow': 'inset 0 1px 0 rgba(255,255,255,0.05)',
    'hover-bg': 'white/90', 'dark-hover-bg': 'white/9', 'hover-border-color': 'gray-900/16', 'dark-hover-border-color': 'white/16', 'data-tile': '' },
  /** Picked state of a tile: blue edge and a soft ring. */
  tileOn: { bg: 'primary/8', 'dark-bg': 'primary/18', 'border-color': 'primary', 'dark-border-color': 'primary', 'hover-bg': 'primary/12', 'dark-hover-bg': 'primary/24', 'hover-border-color': 'primary', 'dark-hover-border-color': 'primary',
    shadow: '0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent)', 'dark-shadow': '0 0 0 3px color-mix(in srgb, var(--primary) 28%, transparent)' },
  /** Nested control surface (buttons, chips, key caps): a faint tint, no outline. */
  card: { bg: 'gray-900/5', 'dark-bg': 'white/6', ...NO_EDGE, rounded: '4px' },
  /** Panel body behind the cards: transparent, so the glass behind it shows. */
  well: { bg: 'transparent', 'dark-bg': 'transparent' },
  /** A section card inside a panel: a soft raised tint with an inner top-light. */
  section: { bg: 'white/55', 'dark-bg': 'white/4', ...NO_EDGE, shadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 3px rgba(15,23,42,0.06)', 'dark-shadow': 'inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.18)', rounded: 'md' },
  /** Text field, select and number field: quiet tint, blue border on focus. */
  field: { bg: 'gray-900/5', 'dark-bg': 'white/6', border: '1px solid', 'border-color': 'transparent', 'dark-border-color': 'transparent', 'hover-bg': 'gray-900/8', 'dark-hover-bg': 'white/9', 'focus-border-color': 'primary', 'dark-focus-border-color': 'primary', rounded: '4px', text: 'gray-900', 'dark-text': 'gray-100' },
  muted: { text: 'gray-500', 'dark-text': 'gray-400' },
  text: { text: 'gray-800', 'dark-text': 'gray-100' },
  hover: { 'hover-bg': 'gray-900/6', 'dark-hover-bg': 'white/7' },
  hoverText: { 'hover-text': 'gray-800', 'dark-hover-text': 'gray-100' },
  active: { bg: 'primary/15', 'dark-bg': 'primary/25', text: 'primary', 'dark-text': 'primary' },
  /** Selected row in a list (layers, components): blue tint with a solid blue edge. */
  selected: { bg: 'primary/10', 'dark-bg': 'primary/20', text: 'primary', 'dark-text': 'white', 'border-l': '2px solid', 'border-color': 'primary' },
  /** Field and section labels. */
  label: { text: 'gray-500', 'dark-text': 'gray-400' },
  /** Separator lines: hairlines that barely register, tuned per theme. */
  divider: { bg: 'gray-900/8', 'dark-bg': 'white/7' },
  /** Colour for a structural border that has to stay (stacked docks, a bar's lower edge): a ghost of a line. */
  hairline: { 'border-color': 'gray-900/8', 'dark-border-color': 'white/7' },
  /** The canvas stage. In dark mode a very faint accent glow gives the floating glass something to blur. */
  canvas: { bg: 'gray-200', 'dark-bg': 'gray-950', 'dark-bg-image': 'radial-gradient(900px 560px at 14% -6%, color-mix(in srgb, var(--primary) 8%, transparent), transparent 70%), radial-gradient(760px 520px at 100% 104%, color-mix(in srgb, var(--primary) 5%, transparent), transparent 70%)' },
  /** Dim layer behind a dialog. */
  overlay: { bg: 'black/32', 'dark-bg': 'black/52', 'backdrop-blur': '4px' },
} as const;

export const ACCENT = '#6366f1';
export const SWATCHES = ['#111827', '#374151', '#6b7280', '#d1d5db', '#f3f4f6', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#14b8a6', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'];

/* ---------- theme colour ----------
   The Studio's `primary` colour is the engine token `--primary`. The chosen accent is written to that one token (see Workspace),
   so every `primary` attribute in the chrome follows it. The design canvas pins the stock value, so a page you design looks
   exactly the way it exports. */
export const ACCENT_DEFAULT = '#4f46e5';
export const ACCENT_CHOICES: { name: string; hex: string }[] = [
  { name: 'Indigo', hex: '#4f46e5' }, { name: 'Blue', hex: '#2563eb' }, { name: 'Sky', hex: '#0284c7' }, { name: 'Teal', hex: '#0d9488' }, { name: 'Emerald', hex: '#059669' }, { name: 'Amber', hex: '#d97706' },
  { name: 'Orange', hex: '#ea580c' }, { name: 'Red', hex: '#dc2626' }, { name: 'Rose', hex: '#e11d48' }, { name: 'Pink', hex: '#db2777' }, { name: 'Violet', hex: '#7c3aed' }, { name: 'Slate', hex: '#475569' },
];
export const isHex = (v: string) => /^#[0-9a-f]{6}$/i.test(v);
/** `--primary` for the chrome. In dark mode the accent is lifted toward white so it keeps its contrast on dark surfaces. */
export const accentValue = (hex: string, dark: boolean) => (dark ? `color-mix(in srgb, ${hex} 82%, white)` : hex);
/** The engine's own `--primary`, used to keep the design canvas independent of the accent. */
export const stockPrimary = (dark: boolean) => (dark ? 'var(--indigo-500)' : 'var(--indigo-600)');
