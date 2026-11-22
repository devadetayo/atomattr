/** Device catalogue for the preview: CSS-pixel viewport sizes (what media queries see) plus how to draw the frame. */
export type DeviceKind = 'phone' | 'tablet' | 'laptop' | 'desktop' | 'responsive';
/** Screen cut-out: a dynamic island, a punch-hole camera, a notch, or none. */
export type Cutout = 'island' | 'punch' | 'notch' | 'none';
export type Device = { id: string; name: string; group: 'Phones' | 'Tablets' | 'Laptops' | 'Desktops' | 'Custom'; kind: DeviceKind; w: number; h: number; cutout?: Cutout; radius?: number; home?: boolean };

export const DEVICES: Device[] = [
  { id: 'iphone-se', name: 'iPhone SE', group: 'Phones', kind: 'phone', w: 375, h: 667, cutout: 'none', radius: 34 },
  { id: 'iphone-15', name: 'iPhone 15', group: 'Phones', kind: 'phone', w: 393, h: 852, cutout: 'island', radius: 55, home: true },
  { id: 'iphone-15-pro', name: 'iPhone 15 Pro', group: 'Phones', kind: 'phone', w: 393, h: 852, cutout: 'island', radius: 55, home: true },
  { id: 'iphone-15-pro-max', name: 'iPhone 15 Pro Max', group: 'Phones', kind: 'phone', w: 430, h: 932, cutout: 'island', radius: 58, home: true },
  { id: 'iphone-14', name: 'iPhone 14', group: 'Phones', kind: 'phone', w: 390, h: 844, cutout: 'notch', radius: 50, home: true },
  { id: 'pixel-8', name: 'Google Pixel 8', group: 'Phones', kind: 'phone', w: 412, h: 915, cutout: 'punch', radius: 40, home: true },
  { id: 'galaxy-s24', name: 'Samsung Galaxy S24', group: 'Phones', kind: 'phone', w: 360, h: 780, cutout: 'punch', radius: 38, home: true },
  { id: 'galaxy-s24-ultra', name: 'Samsung Galaxy S24 Ultra', group: 'Phones', kind: 'phone', w: 412, h: 915, cutout: 'punch', radius: 26, home: true },
  { id: 'galaxy-fold', name: 'Galaxy Z Fold (folded)', group: 'Phones', kind: 'phone', w: 344, h: 882, cutout: 'punch', radius: 34, home: true },
  { id: 'ipad-mini', name: 'iPad mini', group: 'Tablets', kind: 'tablet', w: 744, h: 1133, cutout: 'none', radius: 34 },
  { id: 'ipad-air', name: 'iPad Air', group: 'Tablets', kind: 'tablet', w: 820, h: 1180, cutout: 'none', radius: 34 },
  { id: 'ipad-pro-11', name: 'iPad Pro 11"', group: 'Tablets', kind: 'tablet', w: 834, h: 1194, cutout: 'none', radius: 34 },
  { id: 'ipad-pro-13', name: 'iPad Pro 12.9"', group: 'Tablets', kind: 'tablet', w: 1024, h: 1366, cutout: 'none', radius: 34 },
  { id: 'galaxy-tab', name: 'Samsung Galaxy Tab S9', group: 'Tablets', kind: 'tablet', w: 800, h: 1280, cutout: 'punch', radius: 28 },
  { id: 'macbook-air-13', name: 'MacBook Air 13"', group: 'Laptops', kind: 'laptop', w: 1440, h: 900, cutout: 'notch' },
  { id: 'macbook-pro-14', name: 'MacBook Pro 14"', group: 'Laptops', kind: 'laptop', w: 1512, h: 982, cutout: 'notch' },
  { id: 'macbook-pro-16', name: 'MacBook Pro 16"', group: 'Laptops', kind: 'laptop', w: 1728, h: 1117, cutout: 'notch' },
  { id: 'windows-laptop', name: 'Windows laptop', group: 'Laptops', kind: 'laptop', w: 1366, h: 768, cutout: 'none' },
  { id: 'surface-laptop', name: 'Surface Laptop', group: 'Laptops', kind: 'laptop', w: 1504, h: 1002, cutout: 'none' },
  { id: 'monitor-1080', name: 'Desktop 1080p', group: 'Desktops', kind: 'desktop', w: 1920, h: 1080 },
  { id: 'imac-24', name: 'iMac 24"', group: 'Desktops', kind: 'desktop', w: 2240, h: 1260 },
  { id: 'monitor-1440', name: 'Desktop 1440p', group: 'Desktops', kind: 'desktop', w: 2560, h: 1440 },
  { id: 'responsive', name: 'Responsive (drag to resize)', group: 'Custom', kind: 'responsive', w: 820, h: 700 },
];

export const DEVICE_GROUPS: Device['group'][] = ['Phones', 'Tablets', 'Laptops', 'Desktops', 'Custom'];
export const deviceById = (id: string): Device => DEVICES.find(d => d.id === id) || DEVICES[1];

/** Frame geometry in CSS px around the screen: bezel widths, outer radius, and any extra base (laptop deck, monitor stand) below. */
export function frameFor(d: Device, landscape: boolean): { t: number; r: number; b: number; l: number; radius: number; base: number } {
  switch (d.kind) {
    case 'phone': { const k = d.cutout === 'none' ? (landscape ? { t: 12, r: 70, b: 12, l: 70 } : { t: 70, r: 12, b: 70, l: 12 }) : { t: 12, r: 12, b: 12, l: 12 }; return { ...k, radius: (d.radius || 40) + 12, base: 0 }; }
    case 'tablet': return { t: 22, r: 22, b: 22, l: 22, radius: (d.radius || 30) + 22, base: 0 };
    case 'laptop': return { t: 16, r: 16, b: 16, l: 16, radius: 22, base: 26 };
    case 'desktop': return { t: 14, r: 14, b: 36, l: 14, radius: 18, base: 70 };
    default: return { t: 0, r: 0, b: 0, l: 0, radius: 0, base: 0 };
  }
}
