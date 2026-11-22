/** Where a form sends its data. Each provider is just a set of HTML attributes on the form, so exports need nothing extra. */
export type FormProvider = 'none' | 'formspree' | 'netlify' | 'mailto' | 'custom';
type Attrs = Record<string, string | boolean>;
export const FORM_PROVIDERS: { id: FormProvider; label: string; hint: string; field: string; placeholder: string }[] = [
  { id: 'none', label: 'Not connected', hint: 'The form submits nowhere. Pick where the data should go.', field: '', placeholder: '' },
  { id: 'formspree', label: 'Formspree', hint: 'Create a form at formspree.io and paste its id (or full URL).', field: 'Form id or URL', placeholder: 'xyzabcde' },
  { id: 'netlify', label: 'Netlify Forms', hint: 'Works when the exported site is deployed on Netlify. Give the form a name.', field: 'Form name', placeholder: 'contact' },
  { id: 'mailto', label: 'Email (mailto)', hint: 'Opens the visitor\'s mail app. Simple, but not reliable for real leads.', field: 'Email address', placeholder: 'you@example.com' },
  { id: 'custom', label: 'Your own endpoint', hint: 'POST (or GET) the fields to any URL you control.', field: 'Endpoint URL', placeholder: 'https://example.com/api/contact' },
];
const OWNED = ['action', 'method', 'enctype', 'data-netlify', 'name'];

export function detectProvider(a?: Attrs): { provider: FormProvider; value: string; method: 'post' | 'get' } {
  const action = String(a?.action || ''); const method = String(a?.method || 'post').toLowerCase() === 'get' ? 'get' : 'post';
  if (a?.['data-netlify']) return { provider: 'netlify', value: String(a.name || ''), method };
  if (/^mailto:/i.test(action)) return { provider: 'mailto', value: action.replace(/^mailto:/i, ''), method };
  const fs = /^https:\/\/formspree\.io\/f\/([\w-]+)/i.exec(action); if (fs) return { provider: 'formspree', value: fs[1], method };
  if (action) return { provider: 'custom', value: action, method };
  return { provider: 'none', value: '', method };
}

/** New attribute set for the form; attributes this feature does not own are kept. */
export function formAttrs(prev: Attrs | undefined, provider: FormProvider, value: string, method: 'post' | 'get' = 'post'): Attrs {
  const out: Attrs = {}; for (const [k, v] of Object.entries(prev || {})) if (!OWNED.includes(k)) out[k] = v;
  const v = value.trim();
  switch (provider) {
    case 'formspree': if (v) { out.action = /^https?:\/\//i.test(v) ? v : `https://formspree.io/f/${v}`; out.method = 'post'; } break;
    case 'netlify': out['data-netlify'] = 'true'; out.name = v || 'form'; out.method = 'post'; break;
    case 'mailto': if (v) { out.action = `mailto:${v.replace(/^mailto:/i, '')}`; out.method = 'post'; out.enctype = 'text/plain'; } break;
    case 'custom': if (v) { out.action = v; out.method = method; } break;
  }
  return out;
}
/** Problems with the chosen setup, shown next to the field. */
export function formProblem(provider: FormProvider, value: string): string {
  const v = value.trim(); if (provider === 'none' || !v) return provider === 'none' ? '' : 'Required.';
  if (provider === 'mailto' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.replace(/^mailto:/i, ''))) return 'Not a valid email address.';
  if (provider === 'custom' && !/^https?:\/\//i.test(v)) return 'Use a full URL starting with https://';
  if (provider === 'custom' && /^http:\/\//i.test(v)) return 'http:// endpoints are blocked on https sites.';
  if (provider === 'formspree' && !/^(https:\/\/formspree\.io\/f\/)?[\w-]+$/i.test(v)) return 'Paste the form id from formspree.io.';
  return '';
}
