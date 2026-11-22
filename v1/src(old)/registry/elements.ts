import type { ElementKind } from '../types/project';

export const ELEMENTS: { kind: ElementKind; label: string; icon: string }[] = [
  { kind: 'section', label: 'Section', icon: '▤' },
  { kind: 'heading', label: 'Heading', icon: 'T' },
  { kind: 'text', label: 'Text', icon: '¶' },
  { kind: 'button', label: 'Button', icon: '▭' },
  { kind: 'image', label: 'Image', icon: '▧' },
];

export const ELEMENT_LABEL: Record<ElementKind, string> = {
  section: 'Section',
  heading: 'Heading',
  text: 'Text',
  button: 'Button',
  image: 'Image',
};
