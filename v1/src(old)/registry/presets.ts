import type { DrawKind } from './tools';

/** A ready-made group of elements. Coordinates are relative to the preset's top-left corner. */
export type PresetPart = { kind: DrawKind; x: number; y: number; w: number; h: number; content?: string; style?: Record<string, string> };
export type Preset = { id: string; label: string; hint: string; parts: PresetPart[] };

const clear = { bg: 'transparent' };

export const PRESETS: Preset[] = [
  {
    id: 'navbar', label: 'Navbar', hint: 'Brand on the left, two links and a button',
    parts: [
      { kind: 'section', x: 0, y: 0, w: 960, h: 64, style: { bg: 'gray-900', rounded: 'xl', p: '4' } },
      { kind: 'heading', x: 24, y: 14, w: 200, h: 36, content: 'Brand', style: { ...clear, text: 'white', 'font-size': 'xl', 'font-weight': '700' } },
      { kind: 'text', x: 600, y: 20, w: 80, h: 24, content: 'Features', style: { ...clear, text: 'gray-200', 'font-size': 'sm' } },
      { kind: 'text', x: 700, y: 20, w: 80, h: 24, content: 'Pricing', style: { ...clear, text: 'gray-200', 'font-size': 'sm' } },
      { kind: 'button', x: 808, y: 10, w: 128, h: 44, content: 'Sign up', style: { bg: 'primary', text: 'white', rounded: 'lg', 'font-weight': '600' } },
    ],
  },
  {
    id: 'hero', label: 'Hero', hint: 'Big headline, supporting copy and a call to action',
    parts: [
      { kind: 'section', x: 0, y: 0, w: 960, h: 360, style: { bg: 'gray-900', rounded: 'xl', p: '4' } },
      { kind: 'heading', x: 48, y: 64, w: 640, h: 120, content: 'Build something people love', style: { ...clear, text: 'white', 'font-size': '5xl', 'font-weight': '800' } },
      { kind: 'text', x: 48, y: 200, w: 520, h: 72, content: 'One sentence that explains what you do and who it is for.', style: { ...clear, text: 'gray-200', 'font-size': 'lg' } },
      { kind: 'button', x: 48, y: 288, w: 176, h: 48, content: 'Get started', style: { bg: 'primary', text: 'white', rounded: 'lg', 'font-weight': '600' } },
    ],
  },
  {
    id: 'features', label: 'Feature cards', hint: 'Three cards with a title and description',
    parts: [0, 1, 2].flatMap((i): PresetPart[] => [
      { kind: 'section', x: i * 320, y: 0, w: 288, h: 200, style: { bg: 'gray-100', rounded: 'xl', p: '4' } },
      { kind: 'heading', x: i * 320 + 20, y: 24, w: 248, h: 40, content: `Feature ${i + 1}`, style: { ...clear, 'font-size': 'xl', 'font-weight': '700' } },
      { kind: 'text', x: i * 320 + 20, y: 80, w: 248, h: 96, content: 'Describe the benefit in a sentence or two.', style: { ...clear, text: 'gray-800', 'font-size': 'sm' } },
    ]),
  },
  {
    id: 'cta', label: 'Call to action', hint: 'Full-width coloured band with a headline and a button',
    parts: [
      { kind: 'section', x: 0, y: 0, w: 960, h: 160, style: { bg: 'primary', rounded: 'xl', p: '4' } },
      { kind: 'heading', x: 40, y: 40, w: 560, h: 56, content: 'Ready to get started?', style: { ...clear, text: 'white', 'font-size': '3xl', 'font-weight': '700' } },
      { kind: 'button', x: 744, y: 52, w: 176, h: 52, content: 'Create account', style: { bg: 'white', text: 'primary', rounded: 'lg', 'font-weight': '700' } },
    ],
  },
];
