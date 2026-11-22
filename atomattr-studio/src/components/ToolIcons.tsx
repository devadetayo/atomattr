/* Tool icon set for the studio rail and flyouts.
   One 24px grid, 1.6px round strokes, currentColor. Keys match the `icon` field in tools.ts (plus `code`, `grip`, `flyout`). */

export const hasToolIcon = (n: string) => n in ICONS;

const ICONS: Record<string, React.ReactNode> = {
  /* selection */
  select: <path d="M6 3.5v15.2l3.9-3.7 2.7 5.5 2.5-1.2-2.7-5.4 5.4-.3z" fill="currentColor" />,
  direct: <path d="M6 3.5v15.2l3.9-3.7 2.7 5.5 2.5-1.2-2.7-5.4 5.4-.3z" />,

  /* type */
  text: <path d="M5 6.5V5h14v1.5M12 5v14M9.5 19h5" />,
  heading: <path d="M6 5v14M18 5v14M6 12h12" />,

  /* shapes */
  rect: <rect x="4" y="6" width="16" height="12" rx="1.2" />,
  rounded: <rect x="4" y="6" width="16" height="12" rx="4.5" />,
  ellipse: <ellipse cx="12" cy="12" rx="8.5" ry="6.5" />,
  polygon: <path d="m12 3.5 8 5.8-3 9.2H7l-3-9.2z" />,
  star: <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" />,
  line: <path d="M5 19 19 5" />,
  arrow: <path d="M5 19 19 5M10 5h9v9" />,

  /* drawing */
  pen: <><path d="M12 3.5 6.5 9.5l2 7h7l2-7z" /><path d="M12 3.5v7" /><circle cx="12" cy="12" r="1.4" /><path d="M8.5 16.5v3h7v-3" /></>,
  pencil: <><path d="M4.5 19.5 5.5 15 16 4.5 19.5 8 9 18.5z" /><path d="m13.8 6.7 3.5 3.5" /></>,
  spiral: <path d="M12 12a1.2 1.2 0 0 1 1.2-1.2 2.4 2.4 0 0 1 2.4 2.4 3.6 3.6 0 0 1-3.6 3.6 4.8 4.8 0 0 1-4.8-4.8 6 6 0 0 1 6-6 7.2 7.2 0 0 1 7.2 7.2" />,

  /* interactive effects */
  fountain: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 16 16 8" /><circle cx="8" cy="16" r="1.4" fill="currentColor" /><rect x="14.6" y="6.6" width="2.8" height="2.8" rx=".6" fill="currentColor" /></>,
  transparency: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M5.5 5.5H12V12H5.5zM12 12h6.5v6.5H12z" fill="currentColor" stroke="none" /></>,
  contour: <><rect x="3.5" y="3.5" width="17" height="17" rx="3.5" /><rect x="8" y="8" width="8" height="8" rx="1.5" /></>,
  shadow: <><rect x="4" y="4" width="11" height="11" rx="2" /><path d="M18.5 8.5v8a2 2 0 0 1-2 2h-8" /></>,
  blend: <><rect x="3.5" y="9" width="6" height="6" rx="1.2" /><rect x="14.5" y="9" width="6" height="6" rx="1.2" /><path d="M11.2 12h1.6" /></>,

  /* structure */
  section: <path d="M7 3.5v17M17 3.5v17M3.5 7h17M3.5 17h17" />,
  container: <rect x="4" y="5" width="16" height="14" rx="2.5" strokeDasharray="3 2.4" />,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  component: <><path d="M12 3.3 15.2 6.5 12 9.7 8.8 6.5z" /><path d="M6.5 8.8 9.7 12 6.5 15.2 3.3 12z" /><path d="M17.5 8.8 20.7 12 17.5 15.2 14.3 12z" /><path d="M12 14.3 15.2 17.5 12 20.7 8.8 17.5z" /></>,

  /* content */
  button: <><rect x="3.5" y="8" width="17" height="8" rx="4" /><path d="M8.5 12h7" /></>,
  image: <><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><circle cx="9" cy="10" r="1.6" /><path d="m4 17.5 5-4.5 3.5 3 3-2.5 4.5 4" /></>,
  crop: <path d="M7 3.5v13.5h13.5M3.5 7H17v13.5" />,

  /* utility */
  eyedropper: <path d="m14.5 6.5 3 3M16 3.8a2.1 2.1 0 0 1 3 0l1.2 1.2a2.1 2.1 0 0 1 0 3L17 11.2 12.8 7zM12.8 7 5 14.8l-.5 4.7 4.7-.5 7.8-7.8" />,
  hand: <path d="M8 12V6.2a1.3 1.3 0 0 1 2.6 0V11M10.6 10V4.7a1.3 1.3 0 0 1 2.6 0V11M13.2 10.5V6a1.3 1.3 0 0 1 2.6 0v6M15.8 9.5a1.3 1.3 0 0 1 2.6 0v4.8c0 3.3-2.2 5.7-5.5 5.7h-.6c-2.2 0-3.5-1-4.7-2.6L4.7 14.4a1.4 1.4 0 0 1 2.1-1.8L8 14" />,
  zoom: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5M10.5 8v5M8 10.5h5" /></>,
  code: <path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5M13.5 5.5l-3 13" />,

  /* chrome */
  more: <g fill="currentColor" stroke="none"><circle cx="6" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="18" cy="12" r="1.7" /></g>,
  grip: <g fill="currentColor" stroke="none"><circle cx="7" cy="10" r="1.2" /><circle cx="12" cy="10" r="1.2" /><circle cx="17" cy="10" r="1.2" /><circle cx="7" cy="14" r="1.2" /><circle cx="12" cy="14" r="1.2" /><circle cx="17" cy="14" r="1.2" /></g>,
  flyout: <path d="M22 8v14H8z" fill="currentColor" stroke="none" />,

    /* view bar (header, far right) */
  desktop: <><rect x="3.5" y="4.5" width="17" height="11" rx="2" /><path d="M9 19.5h6M12 15.5v4" /></>,
  tablet: <><rect x="5.5" y="3.5" width="13" height="17" rx="2.2" /><path d="M11 17.5h2" /></>,
  mobile: <><rect x="7.5" y="3" width="9" height="18" rx="2.2" /><path d="M11 18h2" /></>,
  minus: <path d="M5.5 12h13" />,
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  fit: <path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15" />,
  play: <path d="M8 5.5v13l10.5-6.5z" />,
  pages: <><rect x="8.5" y="3.5" width="12" height="14" rx="2" /><path d="M15.5 20.5h-9a2 2 0 0 1-2-2v-11" /></>,
  chevron: <path d="m7 10 5 5 5-5" />,

    /* dockers */
  panel: <><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><path d="M3.5 9.5h17" /></>,
  layers: <><path d="m12 4 8.5 4.5L12 13 3.5 8.5z" /><path d="m3.5 12.5 8.5 4.5 8.5-4.5" /></>,
  sliders: <path d="M4 8h9M17 8h3M4 16h3M11 16h9M15 5.5v5M9 13.5v5" />,
  structure: <><rect x="9" y="3.5" width="6" height="5" rx="1.2" /><rect x="3.5" y="15.5" width="6" height="5" rx="1.2" /><rect x="14.5" y="15.5" width="6" height="5" rx="1.2" /><path d="M12 8.5V12M6.5 15.5V12h11v3.5" /></>,
  styles: <><path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2-1 1.6-2.1-.4-1.2.3-2.4 1.6-2.4H17a3.5 3.5 0 0 0 3.5-3.5C20.5 7 16.8 3.5 12 3.5z" /><g fill="currentColor" stroke="none"><circle cx="7.8" cy="11" r="1.1" /><circle cx="10.5" cy="7.3" r="1.1" /><circle cx="15" cy="7.8" r="1.1" /></g></>,
  reset: <path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5M4.5 4.5v4h4" />,
  pin: <path d="M9 4.5h6M10 4.5v5l-3 3.5h10L14 9.5v-5M12 13v6.5" />,
  collapse: <path d="m7 14 5-5 5 5" />,
  close: <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />,

    /* menus + fields */
  file: <><path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z" /><path d="M14 3.5V8h4.5" /></>,
  filenew: <><path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z" /><path d="M14 3.5V8h4.5M12 11.5v5M9.5 14h5" /></>,
  folder: <path d="M3.5 7a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />,
  save: <><path d="M5.5 4h10l3 3v11.5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4z" /><path d="M8 4v4.5h6V4M8 20v-6h8v6" /></>,
  snapshot: <><path d="M4 8.5a2 2 0 0 1 2-2h1.5l1.5-2h6l1.5 2H18a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /><circle cx="12" cy="12.5" r="3.2" /></>,
  download: <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14" />,
  export: <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 14v4.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V14" />,
  external: <path d="M13.5 4.5h6v6M19.5 4.5 11 13M17.5 13.5v4a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h4" />,
  home: <path d="M4 11.5 12 4.5l8 7M6.5 10v9.5h11V10" />,
  undo: <path d="M8.5 6 4.5 10l4 4M5 10h9a5 5 0 0 1 0 10h-3" />,
  redo: <path d="m15.5 6 4 4-4 4M19 10h-9a5 5 0 0 0 0 10h3" />,
  cut: <><circle cx="6.5" cy="17.5" r="2.5" /><circle cx="6.5" cy="6.5" r="2.5" /><path d="M8.5 8 20 18.5M8.5 16 20 5.5" /></>,
  copy: <><rect x="8.5" y="8.5" width="11" height="11" rx="2" /><path d="M15.5 8.5v-1a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1" /></>,
  paste: <><path d="M9 5.5H7A1.5 1.5 0 0 0 5.5 7v12A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V7A1.5 1.5 0 0 0 17 5.5h-2" /><rect x="9" y="3.5" width="6" height="4" rx="1.2" /></>,
  brush: <><path d="M5 19c1.5 0 3-1 3-2.8 0-1.2-.9-2-2-2s-2.5 1-2.5 2.8c0 1 .5 2 1.5 2z" /><path d="m8.5 14.5 9-9a2 2 0 0 1 2.8 2.8l-9 9" /></>,
  duplicate: <><rect x="4" y="4" width="11" height="11" rx="2" /><rect x="9" y="9" width="11" height="11" rx="2" /></>,
  trash: <path d="M5 7h14M10 7V5h4v2M7 7l.8 12h8.4L17 7M10.5 11v5M13.5 11v5" />,
  selectall: <><path d="M4.5 8V6A1.5 1.5 0 0 1 6 4.5h2M16 4.5h2A1.5 1.5 0 0 1 19.5 6v2M19.5 16v2a1.5 1.5 0 0 1-1.5 1.5h-2M8 19.5H6A1.5 1.5 0 0 1 4.5 18v-2" /><rect x="9" y="9" width="6" height="6" rx="1" /></>,
  deselect: <rect x="5" y="5" width="14" height="14" rx="2" strokeDasharray="3 2.4" />,
  group: <><rect x="3.5" y="3.5" width="17" height="17" rx="2.5" strokeDasharray="3 2.4" /><rect x="7" y="7" width="5" height="5" rx="1" /><rect x="12" y="12" width="5" height="5" rx="1" /></>,
  ungroup: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  enter: <path d="M14 4.5h4.5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H14M4.5 12h10M11 8.5 14.5 12 11 15.5" />,
  exit: <path d="M10 4.5H5.5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1H10M19.5 12h-10M16 8.5l3.5 3.5-3.5 3.5" />,
  tofront: <><rect x="4" y="4" width="10" height="10" rx="2" /><rect x="10" y="10" width="10" height="10" rx="2" fill="currentColor" /></>,
  toback: <><rect x="4" y="4" width="10" height="10" rx="2" fill="currentColor" /><rect x="10" y="10" width="10" height="10" rx="2" /></>,
  forward: <path d="M12 19V6M7 10.5l5-5 5 5" />,
  backward: <path d="M12 5v13M7 13.5l5 5 5-5" />,
  rotate: <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4" />,
  topath: <><path d="M5 18c2-8 5-12 7-12s3 3 3 6 1 6 4 6" /><circle cx="5" cy="18" r="1.4" fill="currentColor" /><circle cx="19" cy="18" r="1.4" fill="currentColor" /></>,
  lock: <><rect x="5.5" y="10.5" width="13" height="9.5" rx="2" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></>,
  eye: <><path d="M2.8 12S6 5.5 12 5.5 21.2 12 21.2 12 18 18.5 12 18.5 2.8 12 2.8 12z" /><circle cx="12" cy="12" r="2.8" /></>,
  actual: <><rect x="3.5" y="5" width="17" height="14" rx="2.5" /><path d="M8.5 9.5v5M7 11l1.5-1.5M14.5 9.5v5M13 11l1.5-1.5" /></>,
  fitwidth: <path d="M4 12h16M7.5 8.5 4 12l3.5 3.5M16.5 8.5 20 12l-3.5 3.5" />,
  rulers: <><rect x="3.5" y="7.5" width="17" height="9" rx="1.5" /><path d="M7.5 7.5v3M11 7.5v4.5M14.5 7.5v3M18 7.5v4.5" /></>,
  guides: <path d="M8 3.5v17M3.5 15h17" strokeDasharray="3 2.4" />,
  safe: <><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><rect x="7" y="8" width="10" height="8" rx="1" strokeDasharray="2.5 2" /></>,
  snap: <path d="M5.5 4.5v8a6.5 6.5 0 0 0 13 0v-8h-4v8a2.5 2.5 0 0 1-5 0v-8zM5.5 8.5h4M14.5 8.5h4" />,
  compare: <><rect x="3.5" y="5" width="7.5" height="14" rx="1.5" /><rect x="13" y="5" width="7.5" height="14" rx="1.5" /></>,
  moon: <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" />,
  sun: <><circle cx="12" cy="12" r="3.8" /><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18" /></>,
  sparkle: <path d="M12 3.5 13.8 10 20.5 12 13.8 14 12 20.5 10.2 14 3.5 12 10.2 10z" />,
  window: <><rect x="3.5" y="5" width="17" height="14" rx="2.5" /><path d="M3.5 9.5h17" /></>,
  check: <path d="m5.5 12.5 4.5 4.5 8.5-9.5" />,
  keyboard: <><rect x="3.5" y="6.5" width="17" height="11" rx="2" /><path d="M7 10h.01M10 10h.01M13 10h.01M16 10h.01M8 14h8" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>,
  weld: <g fill="currentColor" stroke="none"><circle cx="9" cy="12" r="5.5" /><circle cx="15" cy="12" r="5.5" /></g>,
  intersect: <><circle cx="9" cy="12" r="5.5" /><circle cx="15" cy="12" r="5.5" /><path d="M12 7.6a5.5 5.5 0 0 1 0 8.8 5.5 5.5 0 0 1 0-8.8z" fill="currentColor" /></>,
  minusback: <><circle cx="9" cy="12" r="5.5" fill="currentColor" /><circle cx="15" cy="12" r="5.5" /></>,
  minusfront: <><circle cx="9" cy="12" r="5.5" /><circle cx="15" cy="12" r="5.5" fill="currentColor" /></>,
  exclude: <><circle cx="9" cy="12" r="5.5" /><circle cx="15" cy="12" r="5.5" /></>,
  combine: <path d="M5 5h8v6h6v8h-8v-6H5z" />,
};

/** Unknown names fall back to a dashed square so a missing icon is visible, not blank. */
export function ToolIcon({ n, size = 22 }: { n: string; size?: number }) {
  const body = ICONS[n] ?? <rect x="4.5" y="4.5" width="15" height="15" rx="3" strokeDasharray="3 2.5" />;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', flexShrink: 0, width: `${size}px`, height: `${size}px` }}
    >
      {body}
    </svg>
  );
}