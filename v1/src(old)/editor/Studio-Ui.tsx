import type { ComponentProps, ReactNode } from 'react';
import { Box, Btn } from 'atomattr/react';

/**
 * AtomAttr-only look for the Studio chrome. NO css string, NO classNames, NO inline styles.
 * Every surface below is a plain attribute set you can spread onto any AtomAttr component:
 *   <Box {...PANEL} p="3" />
 * The Studio is designed dark-first (gray-900 surfaces, gray-800 hairlines, primary accents); the light values are the fallback.
 */
export const PANEL = {
  bg: 'white', 'dark-bg': 'gray-900',
  border: '1px solid gray-200', 'dark-border-color': 'gray-800',
  rounded: 'xl', shadow: 'xl',
} as const;

export const FIELD = {
  bg: 'gray-50', 'dark-bg': 'gray-950',
  border: '1px solid gray-200', 'dark-border-color': 'gray-800',
  rounded: 'lg', px: '3', py: '2', fontSize: 'sm', text: 'text',
} as const;

export const GHOST = {
  bg: 'gray-100', 'dark-bg': 'gray-800', text: 'text',
  'hover-bg': 'gray-200', 'dark-hover-bg': 'gray-700',
  rounded: 'lg', px: '2', py: '2', fontSize: 'xs', border: 'none',
} as const;

export const DANGER = {
  bg: 'danger/10', text: 'danger', 'hover-bg': 'danger/20',
  rounded: 'lg', px: '2', py: '2', fontSize: 'xs', border: 'none',
} as const;

/** Docked chrome (top bar, tool rail, status bar, page tabs): flat, full-bleed, separated by hairlines instead of floating cards. */
export const BAR = {
  bg: 'white', 'dark-bg': 'gray-900', 'dark-border-color': 'gray-800',
} as const;
/** The surface the pinned dockers sit on, one step darker than a docker card so the cards read as cards. */
export const WELL = {
  bg: 'gray-50', 'dark-bg': 'gray-950', 'dark-border-color': 'gray-800',
} as const;

export function Panel(props: ComponentProps<typeof Box>) { return <Box {...PANEL} {...props} />; }

export function IconButton({ label, onClick, active, disabled, size = '9', children }: { label: string; onClick: () => void; active?: boolean; disabled?: boolean; size?: string; children: ReactNode }) {
  return (
    <Btn type="button" onClick={onClick} disabled={disabled} aria-label={label} aria-pressed={active} title={label}
      display="flex" items="center" justify="center" w={size} h={size} flex="none" rounded="lg" border="none"
      bg={active ? 'primary/15' : 'transparent'} text={active ? 'primary' : disabled ? 'muted' : 'text'}
      hover-bg={active ? 'primary/20' : 'gray-100'} dark-hover-bg={active ? 'primary/20' : 'gray-800'}
      opacity={disabled ? '0.4' : '1'}>
      {children}
    </Btn>
  );
}

export function Divider() { return <Box w="1px" h="6" bg="gray-200" dark-bg="gray-800" flex="none" />; }
/** Horizontal hairline, used between tool groups in the left rail. */
export function Rule() { return <Box w="full" h="1px" bg="gray-200" dark-bg="gray-800" flex="none" my="1" />; }

/* ---------- icons: 18px, stroke = currentColor ---------- */
function Ico({ children, size = 18 }: { children: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const I = {
  logo: <Ico size={20}><path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></Ico>,
  undo: <Ico><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></Ico>,
  redo: <Ico><path d="m15 14 5-5-5-5" /><path d="M20 9H10a6 6 0 0 0 0 12h3" /></Ico>,
  desktop: <Ico><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></Ico>,
  tablet: <Ico><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M11 18h2" /></Ico>,
  mobile: <Ico><rect x="7" y="2.5" width="10" height="19" rx="2" /><path d="M11 18.5h2" /></Ico>,
  chevron: <Ico size={14}><path d="m6 9 6 6 6-6" /></Ico>,
  chevronRight: <Ico size={14}><path d="m9 6 6 6-6 6" /></Ico>,
  chevronLeft: <Ico size={14}><path d="m15 6-6 6 6 6" /></Ico>,
  minus: <Ico size={16}><path d="M5 12h14" /></Ico>,
  check: <Ico size={14}><path d="m5 12 5 5 9-10" /></Ico>,
  moon: <Ico><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></Ico>,
  sun: <Ico><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Ico>,
  gear: <Ico><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></Ico>,
  upload: <Ico><path d="M12 15V4M7 8l5-5 5 5" /><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></Ico>,
  eye: <Ico><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></Ico>,
  eyeOff: <Ico><path d="m3 3 18 18" /><path d="M10.6 6.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.8M6.6 6.7A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4-.9" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></Ico>,
  lock: <Ico size={16}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Ico>,
  unlock: <Ico size={16}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 7.5-2" /></Ico>,
  arrowUp: <Ico size={16}><path d="M12 19V5M6 11l6-6 6 6" /></Ico>,
  arrowDown: <Ico size={16}><path d="M12 5v14M6 13l6 6 6-6" /></Ico>,
  close: <Ico size={16}><path d="M18 6 6 18M6 6l12 12" /></Ico>,
  plus: <Ico size={16}><path d="M12 5v14M5 12h14" /></Ico>,
  dropper: <Ico><path d="m2 22 1-1h3l9-9" /><path d="M3 21v-3l9-9" /><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z" /></Ico>,
  duplicate: <Ico><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></Ico>,
  trash: <Ico><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" /></Ico>,
  forward: <Ico><rect x="3" y="3" width="12" height="12" rx="2" /><path d="M9 21h9a3 3 0 0 0 3-3V9" /></Ico>,
  backward: <Ico><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M15 3H6a3 3 0 0 0-3 3v9" /></Ico>,
  pin: <Ico size={16}><path d="M12 17v5M9 3h6l-1 6 3 3v2H7v-2l3-3-1-6Z" /></Ico>,
  // dockers
  properties: <Ico><path d="M4 6h9M19 6h1M4 12h3M13 12h7M4 18h11M21 18h-1" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></Ico>,
  styles: <Ico><path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 1.5-2.2-.5-1.2.3-2.3 1.6-2.3H17a4 4 0 0 0 4-4C21 6.8 17 3 12 3Z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="15" cy="7.5" r="1" /></Ico>,
  typography: <Ico><path d="M4 20 10 5l6 15M6.2 15h7.6M18 9h3M19.5 9v7" /></Ico>,
  layers: <Ico><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></Ico>,
  pages: <Ico><path d="M7 3h7l5 5v13H7V3Z" /><path d="M14 3v5h5" /></Ico>,
  presets: <Ico><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="M19 16v4M17 18h4" /></Ico>,
  code: <Ico><path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 5l-4 14" /></Ico>,
  colors: <Ico><circle cx="9" cy="9" r="5" /><circle cx="15" cy="9" r="5" /><circle cx="12" cy="15" r="5" /></Ico>,
  transform: <Ico><rect x="6" y="6" width="12" height="12" rx="1" /><path d="M3 9V3h6M21 15v6h-6M3 3l5 5M21 21l-5-5" /></Ico>,
  align: <Ico><path d="M4 3v18M8 7h12M8 17h8" /></Ico>,
  shapes: <Ico><rect x="3" y="12" width="9" height="9" rx="1.5" /><circle cx="17" cy="7" r="4" /><path d="m17 14 4 7h-8l4-7Z" /></Ico>,
  format: <Ico><path d="M19 3 9 13l2 2L21 5l-2-2Z" /><path d="M9 13c-2.5 0-4 1.5-4 4 0 1.5-.5 2.5-2 3 4 1 8 0 8-3.5" /></Ico>,
  // tools
  select: <Ico><path d="m5 3 14 7-6 2-2 6L5 3Z" /></Ico>,
  node: <Ico><path d="M6 17 12 6l6 11" /><rect x="3.5" y="15.5" width="5" height="5" rx="1" /><rect x="9.5" y="3.5" width="5" height="5" rx="1" /><rect x="15.5" y="15.5" width="5" height="5" rx="1" /></Ico>,
  pen: <Ico><path d="m12 19 7-7 3 3-7 7-3-3Z" /><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5Z" /><path d="m2 2 7.6 7.6" /><circle cx="11" cy="11" r="2" /></Ico>,
  opacity: <Ico><path d="M12 3s6.5 6.2 6.5 11a6.5 6.5 0 0 1-13 0C5.5 9.2 12 3 12 3Z" /><path d="M12 3v17.5" /></Ico>,
  hand: <Ico><path d="M8 13V5a1.5 1.5 0 0 1 3 0v6M11 10V3.5a1.5 1.5 0 0 1 3 0V10M14 10V5a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7h-.5a6 6 0 0 1-5-2.7L3 14.5a1.5 1.5 0 0 1 2.5-1.6L8 16" /></Ico>,
  zoom: <Ico><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3M11 8v6M8 11h6" /></Ico>,
  rect: <Ico><rect x="4" y="5" width="16" height="14" rx="2" fill="currentColor" fillOpacity=".2" /></Ico>,
  ellipse: <Ico><ellipse cx="12" cy="12" rx="9" ry="7" fill="currentColor" fillOpacity=".2" /></Ico>,
  line: <Ico><path d="M5 19 19 5" /></Ico>,
  polygon: <Ico><path d="m12 3 8.5 6.2-3.2 10H6.7l-3.2-10L12 3Z" fill="currentColor" fillOpacity=".2" /></Ico>,
  star: <Ico><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" fill="currentColor" fillOpacity=".2" /></Ico>,
  text: <Ico><path d="M5 6V4h14v2M12 4v16M9 20h6" /></Ico>,
  section: <Ico><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18" /></Ico>,
  heading: <Ico><path d="M6 4v16M18 4v16M6 12h12" /></Ico>,
  image: <Ico><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m21 16-5-5-9 9" /></Ico>,
  grid: <Ico><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></Ico>,
  button: <Ico><rect x="3" y="8" width="18" height="8" rx="4" /><path d="M8 12h8" /></Ico>,
} as const;

/** Icon for a registry tool id (or element kind), or null so callers can fall back to the registry glyph. */
export function toolIcon(id: string): ReactNode | null {
  const key = id.startsWith('web:') ? id.slice(4) : id;
  return (I as Record<string, ReactNode>)[key === 'eyedropper' ? 'dropper' : key] ?? null;
}
