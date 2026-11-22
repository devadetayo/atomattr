import type { ReactNode } from 'react';

/* Icon set for the top bar. Same language as the device preview: one 24px grid, 1.8px round strokes, currentColor. */
const Ic = ({ children, size = 20 }: { children: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>{children}</svg>
);

export const BI = {
  menu: <Ic><path d="M4 7h16M4 12h10M4 17h16" /></Ic>,
  search: <Ic><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></Ic>,
  undo: <Ic><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></Ic>,
  redo: <Ic><path d="m15 14 5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" /></Ic>,
  play: <Ic><path d="M7 4.8v14.4a.8.8 0 0 0 1.2.7l11.6-7.2a.8.8 0 0 0 0-1.4L8.2 4.1A.8.8 0 0 0 7 4.8z" /></Ic>,
  pages: <Ic><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></Ic>,
  palette: <Ic><path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7.5" r="1" /><circle cx="14.5" cy="7.5" r="1" /></Ic>,
  sun: <Ic><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" /></Ic>,
  moon: <Ic><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></Ic>,
  check: <Ic size={14}><path d="m5 12 5 5 9-10" /></Ic>,
  chevron: <Ic size={16}><path d="m6 9 6 6 6-6" /></Ic>,
  chevronR: <Ic size={14}><path d="m9 6 6 6-6 6" /></Ic>,
  plus: <Ic><path d="M12 5v14M5 12h14" /></Ic>,
  minus: <Ic><path d="M5 12h14" /></Ic>,
  fit: <Ic><path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" /><rect x="8" y="8" width="8" height="8" rx="1.5" /></Ic>,
  desktop: <Ic><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M9 21h6M12 16v5" /></Ic>,
  tablet: <Ic><rect x="4.5" y="3" width="15" height="18" rx="2.5" /><path d="M11 18h2" /></Ic>,
  mobile: <Ic><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /></Ic>,
  export: <Ic><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 14v4.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V14" /></Ic>,
  layout: <Ic><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M9 4v16M15 4v16" /></Ic>,
  panels: <Ic><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M3 9h18M9 9v11" /></Ic>,
  more: <Ic><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></Ic>,
  reset: <Ic><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></Ic>,
} as const;
export type BarIcon = keyof typeof BI;
