/**
 * SPONSOR WALL DATA
 *
 * To add a sponsor, copy one object into `sponsors` below, pick its tier, and put the
 * logo file in assets/sponsors/. Nothing else needs editing: sponsors.js draws the wall.
 *
 *   {
 *     name: 'Acme Inc.',
 *     tier: 'builder',                     // 'partner' | 'builder' | 'supporter'
 *     url: 'https://acme.com',             // optional, opens in a new tab
 *     logo: 'assets/sponsors/acme.svg',    // optional, shows an initial if missing
 *     logoDark: 'assets/sponsors/acme-dark.svg', // optional, used in dark mode
 *     verified: true,                      // REQUIRED. Entries without it are never shown.
 *   },
 *
 * Only set verified: true after the sponsorship is confirmed on the provider
 * (GitHub Sponsors, Buy Me a Coffee, Ko-fi or Open Collective).
 * To retire a sponsor, delete the object or set verified: false.
 * Tiers with no sponsors are not shown, and with none at all the page shows an honest empty state.
 */

// Layout per tier. `cols` is logos per row, `size` is each square in rem,
// `gap` uses the same 0.25rem steps as the gap attribute. Change the numbers to resize a tier.
export const sponsorTiers = [
  {
    id: 'partner', name: 'Partner', icon: 'ri-vip-crown-line', tone: 'success', rounded: '3xl', pad: '3',
    cols: { base: 4, md: 4, lg: 4 }, size: { base: 3.5, md: 7, lg: 8 }, gap: { base: 3, md: 5 },
    note: 'Largest logos, 4 per row',
  },
  {
    id: 'builder', name: 'Builder', icon: 'ri-hammer-line', tone: 'primary', rounded: '2xl', pad: '2',
    cols: { base: 4, md: 8, lg: 8 }, size: { base: 3.5, md: 4, lg: 5 }, gap: { base: 3, md: 3 },
    note: 'Medium logos, 8 per row',
  },
  {
    id: 'supporter', name: 'Supporter', icon: 'ri-heart-3-line', tone: 'warning', rounded: 'xl', pad: '1.5',
    cols: { base: 6, md: 12, lg: 12 }, size: { base: 2.25, md: 3, lg: 4 }, gap: { base: 2, md: 2 },
    note: 'Smallest logos, 12 per row',
  },
];

export const sponsors = [
  // Add verified sponsors here.
];