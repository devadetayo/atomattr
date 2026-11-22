/** Starting templates offered on the welcome screen. Kept free of imports so any module can read it. */
export type PresetId = 'blank' | 'landing' | 'portfolio' | 'shop' | 'finance' | 'fintech' | 'brand' | 'dress' | 'designer' | 'dashboard' | 'market' | 'velour' | 'mortgage' | 'tasks' | 'finexus' | 'artshop';
export const PRESETS: { id: PresetId; name: string; blurb: string }[] = [
  { id: 'finance', name: 'Finance landing', blurb: 'Purple and lime: hero card, solutions, security, FAQ.' },
  { id: 'fintech', name: 'Fintech app', blurb: 'Dashboard hero, goals, knowledge articles and FAQ.' },
  { id: 'brand', name: 'Fashion store', blurb: 'Sage hero tiles, categories and a new collection grid.' },
  { id: 'dress', name: 'Stylish dress', blurb: 'Huge headline, model tiles, arrivals and a blog.' },
  { id: 'designer', name: 'UI/UX designer', blurb: 'Soft blue portfolio with services, pricing and cases.' },
  { id: 'dashboard', name: 'Transactions dashboard', blurb: 'Dark sidebar, searchable table that folds on phones.' },
  { id: 'market', name: 'Marketplace', blurb: 'Flash sale, official stores, promos and product grids.' },
  { id: 'velour', name: 'Editorial fashion', blurb: 'Big type, black brand band and an orange accent.' },
  { id: 'mortgage', name: 'Mortgage broker', blurb: 'Serif headlines, black and white with a blue accent, stats and timeline.' },
  { id: 'tasks', name: 'Task manager app', blurb: 'Soft green hero, feature cards, testimonials, FAQ and a dark CTA.' },
  { id: 'finexus', name: 'Dark finance dashboard', blurb: 'Black sidebar, lime stats, cash flow bars and transactions.' },
  { id: 'artshop', name: 'Art print shop', blurb: 'Blue hero, trending prints, yellow combo offer and happy customers.' },
  { id: 'blank', name: 'Blank', blurb: 'One empty section.' },
];
