import type { ElementKind, SiteElement, StudioPage, StudioProject } from '../types/project';
import type { DesignKind, DesignObject } from '../types/project';

export function createDesignObject(kind: DesignKind, x = 80, y = 80, width = 180, height = 120): DesignObject {
  return {
    id: crypto.randomUUID(), kind, x, y, width, height,
    fill: kind === 'line' ? 'none' : kind === 'text' ? '#172033' : '#dfe7ff', stroke: '#635bff', strokeWidth: 2, opacity: 1, rotation: 0,
    ...(kind === 'text' ? { text: 'Your text', fontSize: 32 } : {}),
    ...(kind === 'image' ? { fill: '#eef2ff' } : {}),
    ...(kind === 'polygon' ? { points: 6 } : {}),
    ...(kind === 'star' ? { points: 5, radius: 0.46 } : {}),
  };
}

export function createElement(kind: ElementKind): SiteElement {
  const labels: Record<ElementKind, string> = {
    section: 'New section',
    heading: 'Your heading',
    text: 'Add supporting text to your page.',
    button: 'Get started',
    image: 'Add an image',
  };
  const styles: Record<ElementKind, SiteElement['style']> = {
    section: { bg: 'primary/5', text: 'primary', p: '3', display: 'flex', gap: '4', w: 'full' },
    heading: { bg: 'transparent', text: 'foreground', p: '0', 'font-size': '4xl', 'font-weight': '700', align: 'left' },
    text: { bg: 'transparent', text: 'gray-600', p: '0', 'font-size': 'lg', 'font-weight': '400', align: 'left' },
    button: { bg: 'primary', text: 'white', p: '3', rounded: 'full', 'font-weight': '600' },
    image: { bg: 'gray-100', text: 'foreground', p: '0', w: 'full', h: '64', 'object-fit': 'cover', rounded: 'xl' },
  };
  return { id: crypto.randomUUID(), kind, content: labels[kind], style: styles[kind] };
}

export function createProject(): StudioProject {
  const pageId = crypto.randomUUID();
  const place = (element: SiteElement, x: number, y: number, w: number, h: number): SiteElement => ({
    ...element,
    style: { ...element.style, position: 'absolute', left: `${x}px`, top: `${y}px`, w: `${w}px`, h: `${h}px` } as SiteElement['style'],
  });
  return {
    version: 2,
    id: crypto.randomUUID(),
    name: 'Untitled website',
    activePageId: pageId,
    pages: [{ id: pageId, name: 'Home', elements: [
      place(createElement('section'), 80, 80, 1040, 400),
      place({ ...createElement('heading'), content: 'Build something great.' }, 130, 145, 520, 64),
      place({ ...createElement('text'), content: 'Select an element to edit it, or add a new one from the left toolbar.' }, 130, 230, 420, 72),
      place({ ...createElement('button'), content: 'Get started' }, 130, 330, 160, 48),
    ] }],
  };
}

export function createPage(name: string): StudioPage {
  return { id: crypto.randomUUID(), name, elements: [] };
}
