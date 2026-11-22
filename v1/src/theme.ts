/**
 * Central design tokens. These are AtomAttr attribute presets, spread onto components: <Box {...T.panel} />.
 * There is no CSS anywhere in the Studio; light and dark come from the `dark-` attribute prefix.
 */
export const T = {
  app: { bg: 'gray-100', 'dark-bg': 'gray-950', text: 'gray-800', 'dark-text': 'gray-100' },
  chrome: { bg: 'white', 'dark-bg': 'gray-900', 'border-color': 'gray-200', 'dark-border-color': 'gray-800' },
  panel: { bg: 'white', 'dark-bg': 'gray-900', border: '1px solid gray-200', 'dark-border-color': 'gray-700', rounded: 'lg', shadow: 'lg' },
  card: { bg: 'gray-50', 'dark-bg': 'gray-800', border: '1px solid gray-200', 'dark-border-color': 'gray-700', rounded: 'md' },
  field: { bg: 'white', 'dark-bg': 'gray-800', border: '1px solid gray-300', 'dark-border-color': 'gray-600', rounded: 'md', text: 'gray-900', 'dark-text': 'gray-100' },
  muted: { text: 'gray-500', 'dark-text': 'gray-400' },
  text: { text: 'gray-800', 'dark-text': 'gray-100' },
  hover: { 'hover-bg': 'gray-100', 'dark-hover-bg': 'gray-800' },
  active: { bg: 'primary/15', 'dark-bg': 'primary/25', text: 'primary', 'dark-text': 'primary' },
  divider: { bg: 'gray-200', 'dark-bg': 'gray-700' },
  canvas: { bg: 'gray-200', 'dark-bg': 'gray-950' },
  overlay: { bg: 'black', opacity: '50' },
} as const;

export const ACCENT = '#6366f1';
export const SWATCHES = ['#111827', '#374151', '#6b7280', '#d1d5db', '#f3f4f6', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#14b8a6', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'];
