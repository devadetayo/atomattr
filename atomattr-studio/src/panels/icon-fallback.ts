const FALLBACK_ICON_PATHS: Record<string, string> = {
  home: 'M4 11l8-7 8 7v9h-5v-6H9v6H4z',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM16 16l5 5',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9.5h.01',
  file: 'M6 3h8l5 5v13H6zM14 3v5h5',
  folder: 'M3 6h6l2 2h10v11H3z',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-8 8a8 8 0 0116 0',
  settings: 'M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12',
  menu: 'M4 7h16M4 12h16M4 17h16',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12l5 5 9-10',
  x: 'M6 6l12 12M18 6L6 18',
  default: 'M12 3l2.5 7.5L22 12l-7.5 1.5L12 21l-2.5-7.5L2 12l7.5-1.5z',
};

export function getFallbackIconSvg(full: string): string {
  const rawName = (full || '').split(':').pop()?.toLowerCase() || 'default';
  const key = rawName.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const name = key in FALLBACK_ICON_PATHS ? key : 'default';
  const path = FALLBACK_ICON_PATHS[name];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${path}" /></svg>`;
}

export function getIconSvgDataUrl(full: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(getFallbackIconSvg(full))}`;
}
