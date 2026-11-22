export type Lang = 'html' | 'jsx' | 'css' | 'text';
export type Kind = 'plain' | 'comment' | 'string' | 'tag' | 'attr' | 'keyword' | 'literal' | 'number' | 'title' | 'type' | 'meta';
export type Token = { k: Kind; v: string };

export type TokenKind = Exclude<Kind, 'plain'>;
export type Variant = { bg: string; fg: string; c: Record<TokenKind, string> };
export type Theme = { id: string; name: string; light: Variant; dark: Variant };

const ORDER: TokenKind[] = ['comment', 'string', 'tag', 'attr', 'keyword', 'literal', 'number', 'title', 'type', 'meta'];
const v = (bg: string, fg: string, cols: string[]): Variant => ({ bg, fg, c: Object.fromEntries(ORDER.map((k, i) => [k, cols[i]])) as Variant['c'] });
const both = (id: string, name: string, x: Variant): Theme => ({ id, name, light: x, dark: x });

/** Dark-only themes use the same variant for both modes. */
export const isDarkOnly = (t: Theme) => t.light === t.dark;

export const THEMES: Theme[] = [
  { id: 'playground', name: 'Foundation / Monokai Sublime',
    light: v('#eeeeee', '#000000', ['#998', '#d14', '#007700', '#990073', '#099', '#099', '#099', '#900', '#458', '#3344bb']),
    dark: v('#23241f', '#f8f8f2', ['#75715e', '#a6e22e', '#f92672', '#bf79db', '#f92672', '#ae81ff', '#ae81ff', '#a6e22e', '#66d9ef', '#75715e']) },
  { id: 'github', name: 'GitHub',
    light: v('#ffffff', '#24292e', ['#6a737d', '#032f62', '#22863a', '#6f42c1', '#d73a49', '#005cc5', '#005cc5', '#6f42c1', '#e36209', '#6a737d']),
    dark: v('#0d1117', '#c9d1d9', ['#8b949e', '#a5d6ff', '#7ee787', '#79c0ff', '#ff7b72', '#79c0ff', '#79c0ff', '#d2a8ff', '#ffa657', '#8b949e']) },
  { id: 'solarized', name: 'Solarized',
    light: v('#fdf6e3', '#657b83', ['#93a1a1', '#2aa198', '#268bd2', '#b58900', '#859900', '#6c71c4', '#d33682', '#268bd2', '#b58900', '#cb4b16']),
    dark: v('#002b36', '#839496', ['#586e75', '#2aa198', '#268bd2', '#b58900', '#859900', '#6c71c4', '#d33682', '#268bd2', '#b58900', '#cb4b16']) },
  { id: 'one', name: 'Atom One',
    light: v('#fafafa', '#383a42', ['#a0a1a7', '#50a14f', '#e45649', '#986801', '#a626a4', '#0184bb', '#986801', '#4078f2', '#c18401', '#4078f2']),
    dark: v('#282c34', '#abb2bf', ['#5c6370', '#98c379', '#e06c75', '#d19a66', '#c678dd', '#56b6c2', '#d19a66', '#61afef', '#e5c07b', '#61afef']) },
  both('dracula', 'Dracula', v('#282a36', '#f8f8f2', ['#6272a4', '#f1fa8c', '#ff79c6', '#50fa7b', '#ff79c6', '#bd93f9', '#bd93f9', '#50fa7b', '#8be9fd', '#6272a4'])),
  both('nord', 'Nord', v('#2e3440', '#d8dee9', ['#616e88', '#a3be8c', '#81a1c1', '#8fbcbb', '#81a1c1', '#81a1c1', '#b48ead', '#88c0d0', '#8fbcbb', '#5e81ac'])),
  both('tokyo', 'Tokyo Night', v('#1a1b26', '#a9b1d6', ['#565f89', '#9ece6a', '#f7768e', '#e0af68', '#bb9af7', '#ff9e64', '#ff9e64', '#7aa2f7', '#2ac3de', '#565f89'])),
];

export const DEFAULT_THEME = 'playground';
export const themeById = (id: string): Theme => THEMES.find(t => t.id === id) ?? THEMES[0];

const JS_KEYWORDS = new Set(['const', 'let', 'var', 'if', 'else', 'return', 'function', 'class', 'new', 'import', 'from', 'export', 'default', 'async', 'await', 'try', 'catch', 'throw', 'switch', 'case', 'break', 'continue', 'typeof', 'instanceof', 'extends', 'implements', 'in', 'of', 'for', 'while', 'do', 'yield', 'finally', 'with', 'delete', 'this', 'super', 'void']);
const CSS_KEYWORDS = new Set(['display', 'flex', 'grid', 'block', 'inline', 'absolute', 'relative', 'fixed', 'static', 'none', 'auto', 'transparent', 'center', 'left', 'right', 'top', 'bottom', 'justify', 'align', 'content', 'items', 'padding', 'margin', 'border', 'background', 'color', 'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height', 'font', 'font-size', 'font-weight', 'position', 'overflow', 'opacity', 'transform', 'transition', 'animation']);

export function tokenize(code: string, lang: Lang): Token[] {
  if (!code) return [{ k: 'plain', v: '' }];
  if (lang === 'text') return [{ k: 'plain', v: code }];

  const out: Token[] = [];
  let i = 0;
  const push = (kind: Token['k'], value: string) => {
    if (value) out.push({ k: kind, v: value });
  };

  while (i < code.length) {
    const ch = code[i];
    const rest = code.slice(i);

    if (lang === 'html' && rest.startsWith('<!--')) {
      const end = code.indexOf('-->', i + 4);
      const v = end >= 0 ? code.slice(i, end + 3) : code.slice(i);
      push('comment', v); i += v.length; continue;
    }

    if (lang === 'html' && ch === '<') {
      const end = code.indexOf('>', i + 1);
      if (end < 0) { push('plain', rest); break; }
      const raw = code.slice(i, end + 1);
      const inner = raw.slice(1, -1).trim();
      if (inner.startsWith('/')) {
        push('tag', raw); i = end + 1; continue;
      }

      const match = inner.match(/^([A-Za-z][\w:-]*)/);
      if (match) {
        const tagName = match[1];
        let p = match[0].length + 1; // after the tag name, skip '<' + name
        const head = raw.slice(0, p);
        push('tag', head);
        while (p < raw.length - 1) {
          const s = raw.slice(p);
          const ws = s.match(/^\s+/);
          if (ws) { push('plain', ws[0]); p += ws[0].length; continue; }
          if (s[0] === '>') { push('plain', '>'); p += 1; continue; }
          if (s[0] === '/') { push('plain', '/'); p += 1; continue; }
          if (s[0] === '=') { push('plain', '='); p += 1; continue; }
          const attr = s.match(/^([A-Za-z_:][-A-Za-z0-9_:.]*)/);
          if (attr) {
            push('attr', attr[1]); p += attr[1].length; continue;
          }
          const q = s[0];
          if (q === '"' || q === "'") {
            let j = 1;
            while (j < s.length && s[j] !== q) j += 1;
            const val = s.slice(0, j + 1);
            push('string', val);
            p += val.length;
            continue;
          }
          const bare = s.match(/^[^\s>/]+/);
          if (bare) {
            push('string', bare[0]); p += bare[0].length; continue;
          }
          push('plain', s[0]); p += 1;
        }
        i = end + 1;
        continue;
      }

      push('tag', raw); i = end + 1; continue;
    }

    if (ch === '"' || ch === "'") {
      const q = ch;
      let j = i + 1;
      while (j < code.length) {
        if (code[j] === '\\' && j + 1 < code.length) { j += 2; continue; }
        if (code[j] === q) break;
        j += 1;
      }
      const v = code.slice(i, j + 1);
      push('string', v); i = Math.min(j + 1, code.length); continue;
    }
    if (ch === '/' && rest.startsWith('//')) {
      const end = code.indexOf('\n', i + 2);
      const v = end >= 0 ? code.slice(i, end) : code.slice(i);
      push('comment', v); i += v.length; continue;
    }
    if (lang === 'css' && ch === '/' && rest.startsWith('/*')) {
      const end = code.indexOf('*/', i + 2);
      const v = end >= 0 ? code.slice(i, end + 2) : code.slice(i);
      push('comment', v); i += v.length; continue;
    }
    if (/[A-Za-z_$]/.test(ch)) {
      const match = rest.match(/^[A-Za-z_$][\w$-]*/);
      const word = match ? match[0] : ch;
      const lower = word.toLowerCase();
      if (lang === 'css' && CSS_KEYWORDS.has(lower)) { push('attr', word); i += word.length; continue; }
      if (JS_KEYWORDS.has(lower)) { push('keyword', word); i += word.length; continue; }
      if (lower === 'true' || lower === 'false' || lower === 'null' || lower === 'undefined') { push('literal', word); i += word.length; continue; }
      if (lang === 'html' && /^[A-Z]/.test(word)) { push('type', word); i += word.length; continue; }
      if (lang === 'jsx' && /^[A-Z]/.test(word)) { push('title', word); i += word.length; continue; }
      push('plain', word); i += word.length; continue;
    }
    if (/\d/.test(ch)) {
      const match = rest.match(/^\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/);
      const v = match ? match[0] : ch;
      push('number', v); i += v.length; continue;
    }
    if (lang === 'css' && ch === '@') {
      const match = rest.match(/^@[A-Za-z-]+/);
      const v = match ? match[0] : ch;
      push('meta', v); i += v.length; continue;
    }

    push('plain', ch);
    i += 1;
  }

  return out;
}