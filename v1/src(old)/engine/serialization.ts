import { createElement, createProject } from './document';
import type { DesignKind, DesignObject, ElementKind, SiteElement, StudioProject, StyleKey } from '../types/project';

const STORAGE_KEY = 'atomattr-studio-project-v1';
const KINDS = new Set<ElementKind>(['section', 'heading', 'text', 'button', 'image']);
const STYLE_KEYS: StyleKey[] = ['bg', 'text', 'p', 'font-size', 'font-weight', 'align', 'rounded', 'w', 'h', 'object-fit', 'display', 'gap'];
const GEOMETRY_STYLE_KEYS = ['position', 'left', 'top'];
const DESIGN_KINDS = new Set<DesignKind>(['rect', 'ellipse', 'line', 'polygon', 'star', 'text', 'image']);

export function deserializeProject(raw: string | null): StudioProject {
  if (!raw) return createProject();
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (value.version === 1 && typeof value.id === 'string' && typeof value.name === 'string' && Array.isArray(value.elements)) {
      const page = { id: crypto.randomUUID(), name: 'Home', elements: value.elements as SiteElement[] };
      const legacy = { version: 2 as const, id: value.id, name: value.name, activePageId: page.id, pages: [page] };
      return normalizeProject(legacy) || createProject();
    }
    if (value.version !== 2 || typeof value.id !== 'string' || typeof value.name !== 'string' || !Array.isArray(value.pages)) {
      return createProject();
    }
    return normalizeProject(value as unknown as StudioProject) || createProject();
  } catch {
    return createProject();
  }
}

export function parseProjectFile(raw: string): StudioProject {
  const value = JSON.parse(raw) as Record<string, unknown>;
  if (value.version === 1 && typeof value.id === 'string' && typeof value.name === 'string' && Array.isArray(value.elements)) {
    const page = { id: crypto.randomUUID(), name: 'Home', elements: value.elements as SiteElement[] };
    const migrated = normalizeProject({ version: 2, id: value.id, name: value.name, activePageId: page.id, pages: [page] });
    if (migrated) return migrated;
  } else if (value.version === 2 && typeof value.id === 'string' && typeof value.name === 'string' && Array.isArray(value.pages)) {
    const normalized = normalizeProject(value as unknown as StudioProject);
    if (normalized) return normalized;
  }
  throw new Error('This file is not a valid AtomAttr Studio project.');
}

function normalizeProject(project: StudioProject): StudioProject | null {
  if (!Array.isArray(project.pages) || project.pages.length === 0) return null;
  const ids = new Set<string>();
  const pages = project.pages.map(page => {
    if (!page || typeof page.id !== 'string' || typeof page.name !== 'string' || !Array.isArray(page.elements) || (page.objects !== undefined && !Array.isArray(page.objects))) return null;
    const elements: SiteElement[] = [];
    const kindOffsets = new Map<string, number>();
    for (const element of page.elements) {
      if (!element || typeof element !== 'object' || typeof element.id !== 'string' || typeof element.content !== 'string' || !KINDS.has(element.kind)) return null;
      const defaults = createElement(element.kind);
      const rawStyle: Record<string, unknown> = element.style && typeof element.style === 'object' ? element.style as unknown as Record<string, unknown> : {};
      const style: Record<string, unknown> = {
        ...defaults.style,
        bg: typeof rawStyle.bg === 'string' ? rawStyle.bg : defaults.style.bg,
        text: typeof rawStyle.text === 'string' ? rawStyle.text : defaults.style.text,
        p: typeof rawStyle.p === 'string' ? rawStyle.p : defaults.style.p,
        md: normalizeBreakpointStyle(rawStyle.md),
        lg: normalizeBreakpointStyle(rawStyle.lg),
      };
      for (const key of STYLE_KEYS) if (typeof rawStyle[key] === 'string') style[key] = rawStyle[key] as never;
      for (const key of GEOMETRY_STYLE_KEYS) if (typeof rawStyle[key] === 'string') style[key] = rawStyle[key] as never;
      if (typeof rawStyle.left !== 'string' && typeof rawStyle.top !== 'string') {
        const fallbacks: Record<ElementKind, { x: number; y: number; w: number; h: number }> = {
          section: { x: 80, y: 80, w: 1040, h: 400 },
          heading: { x: 130, y: 145, w: 520, h: 64 },
          text: { x: 130, y: 230, w: 420, h: 72 },
          button: { x: 130, y: 330, w: 160, h: 48 },
          image: { x: 700, y: 145, w: 340, h: 260 },
        };
        const fallback = fallbacks[element.kind];
        const offset = kindOffsets.get(element.kind) || 0;
        kindOffsets.set(element.kind, offset + 1);
        style.position = 'absolute'; style.left = `${fallback.x + offset * 24}px`; style.top = `${fallback.y + offset * 24}px`;
        style.w = `${fallback.w}px`; style.h = `${fallback.h}px`;
      }
      let normalized: SiteElement = { ...defaults, ...element, style: style as SiteElement['style'] };
      if (ids.has(normalized.id)) normalized = { ...normalized, id: crypto.randomUUID() };
      ids.add(normalized.id);
      elements.push(normalized);
    }
    const objects: DesignObject[] = [];
    for (const object of page.objects || []) {
      if (!object || typeof object !== 'object' || typeof object.id !== 'string' || !DESIGN_KINDS.has(object.kind)) return null;
      const number = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
      let normalized: DesignObject = {
        id: object.id,
        kind: object.kind,
        x: number(object.x, 0), y: number(object.y, 0),
        width: Math.max(1, number(object.width, 100)), height: Math.max(1, number(object.height, 80)),
        fill: typeof object.fill === 'string' ? object.fill : 'none',
        stroke: typeof object.stroke === 'string' ? object.stroke : '#635bff',
        strokeWidth: Math.max(0, number(object.strokeWidth, 2)),
        opacity: Math.min(1, Math.max(0, number(object.opacity, 1))),
        rotation: number(object.rotation, 0),
        ...(typeof object.text === 'string' ? { text: object.text } : {}),
        ...(typeof object.textColor === 'string' ? { textColor: object.textColor } : {}),
        ...(typeof object.src === 'string' ? { src: object.src } : {}),
        ...(typeof object.fontSize === 'number' && Number.isFinite(object.fontSize) ? { fontSize: Math.max(1, object.fontSize) } : {}),
        ...(typeof object.points === 'number' && Number.isFinite(object.points) ? { points: Math.max(3, Math.floor(object.points)) } : {}),
        ...(typeof object.radius === 'number' && Number.isFinite(object.radius) ? { radius: Math.min(0.49, Math.max(0.1, object.radius)) } : {}),
      };
      if (object.kind === 'text' && typeof object.text !== 'string') return null;
      if (ids.has(normalized.id)) normalized = { ...normalized, id: crypto.randomUUID() };
      ids.add(normalized.id);
      objects.push(normalized);
    }
    return { id: page.id, name: page.name, elements, objects };
  });
  if (pages.some(page => page === null)) return null;
  const validPages = pages as NonNullable<(typeof pages)[number]>[];
  const activePageId = validPages.some(page => page.id === project.activePageId) ? project.activePageId : validPages[0].id;
  return { version: 2, id: project.id, name: project.name, pages: validPages, activePageId };
}

function normalizeBreakpointStyle(value: unknown): SiteElement['style']['md'] {
  if (!value || typeof value !== 'object') return undefined;
  const input = value as Record<string, unknown>;
  const output: NonNullable<SiteElement['style']['md']> = {};
  for (const key of STYLE_KEYS) if (typeof input[key] === 'string') output[key] = input[key] as never;
  return Object.keys(output).length ? output : undefined;
}

export function loadProject(): StudioProject {
  try { return deserializeProject(localStorage.getItem(STORAGE_KEY)); }
  catch { return createProject(); }
}

export function saveProject(project: StudioProject): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
}
