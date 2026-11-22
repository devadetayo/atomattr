export type FmtLang = 'html' | 'jsx' | 'css' | 'vue';

/** Svelte and Angular have no standalone Prettier plugin that works here, so they show as generated. */
export function formatLang(target: string): FmtLang | null {
  const x = target.toLowerCase();
  if (x.includes('react')) return 'jsx';
  if (x.includes('vue')) return 'vue';
  if (x.includes('svelte') || x.includes('angular')) return null;
  if (x.includes('css') && !x.includes('html')) return 'css';
  if (x.includes('html')) return 'html';
  return null;
}

const PARSER: Record<FmtLang, string> = { html: 'html', jsx: 'babel-ts', css: 'css', vue: 'vue' };
const LOAD: Record<FmtLang, (() => Promise<any>)[]> = {
  html: [() => import('prettier/plugins/html')],
  jsx: [() => import('prettier/plugins/babel'), () => import('prettier/plugins/estree')],
  css: [() => import('prettier/plugins/postcss')],
  vue: [() => import('prettier/plugins/html'), () => import('prettier/plugins/babel'), () => import('prettier/plugins/estree'), () => import('prettier/plugins/postcss'), () => import('prettier/plugins/typescript')],
};

export async function formatCode(code: string, lang: string): Promise<string> {
  const l = lang as FmtLang;
  const [{ format }, ...mods] = await Promise.all([import('prettier/standalone'), ...LOAD[l].map(load => load())]);
  return format(code, { parser: PARSER[l], plugins: mods.map(m => m.default ?? m), printWidth: 80, tabWidth: 2 });
}