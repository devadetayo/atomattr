/**
 * More dark-mode toggles. Each is a <button data-ui="dm-*"> with the Theme behavior; the runtime puts class "dark" on <html>,
 * and every look below switches on `html.dark`. Pure CSS: no images, only inline SVG data URIs for the sun and moon.
 */
const ico = (stroke: string, body: string) => `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${stroke}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E${body}%3C/svg%3E")`;
const SUN = (c = '%23f59e0b') => ico(c, "%3Ccircle cx='12' cy='12' r='4'/%3E%3Cpath d='M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'/%3E");
const MOON = (c = '%23a5b4fc') => ico(c, "%3Cpath d='M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z'/%3E");
const T = 'transition:all .35s cubic-bezier(.4,0,.2,1)';
const BASE = (id: string) => `[data-ui="${id}"]{position:relative;cursor:pointer;${T}}[data-ui="${id}"]:focus-visible{outline:2px solid #6366f1;outline-offset:2px}`;
/** A sliding-thumb pill: a round thumb carrying the sun, which slides over and shows the moon in dark. */
const slider = (id: string, light: string, dark: string, o: { r?: string; thumb?: string; inset?: number; thumbDark?: string } = {}) => `${BASE(id)}
[data-ui="${id}"]{background:${light}!important;border-color:transparent!important}
[data-ui="${id}"]::before{content:"";position:absolute;top:${o.inset ?? 3}px;left:${o.inset ?? 3}px;height:calc(100% - ${(o.inset ?? 3) * 2}px);aspect-ratio:1;border-radius:${o.r ?? '50%'};background:${o.thumb ?? '#fff'} ${SUN()} center/60% no-repeat;box-shadow:0 1px 3px rgba(0,0,0,.25);${T}}
html.dark [data-ui="${id}"]{background:${dark}!important}
html.dark [data-ui="${id}"]::before{left:calc(100% - ${o.inset ?? 3}px);transform:translateX(-100%);background:${o.thumbDark ?? '#0f172a'} ${MOON()} center/60% no-repeat}`;
export const UI_DM: Record<string, string> = {
  'dm-warm': slider('dm-warm', 'linear-gradient(90deg,#fde68a,#fb923c)', 'linear-gradient(90deg,#312e81,#6d28d9)'),
  'dm-square': slider('dm-square', '#e5e7eb', '#1f2937', { r: '8px', thumbDark: '#4f46e5' }),
  'dm-mono': slider('dm-mono', '#ffffff', '#000000', { thumb: '#111827', thumbDark: '#ffffff' }).replace(`${SUN()}`, SUN('%23ffffff')).replace(`${MOON()}`, MOON('%230f172a')) + '\n[data-ui="dm-mono"]{box-shadow:inset 0 0 0 2px #111827!important}html.dark [data-ui="dm-mono"]{box-shadow:inset 0 0 0 2px #fff!important}',
  'dm-ocean': slider('dm-ocean', 'linear-gradient(90deg,#7dd3fc,#38bdf8)', 'linear-gradient(90deg,#0c4a6e,#082f49)', { thumbDark: '#e0f2fe' }),
  'dm-ring': `${BASE('dm-ring')}
[data-ui="dm-ring"]{background:#fff!important;border:2px solid #f59e0b!important}
[data-ui="dm-ring"]::before{content:"";position:absolute;inset:18%;background:${SUN()} center/contain no-repeat;${T}}
html.dark [data-ui="dm-ring"]{background:#0f172a!important;border-color:#818cf8!important;box-shadow:0 0 14px rgba(129,140,248,.55)}
html.dark [data-ui="dm-ring"]::before{background-image:${MOON()};transform:rotate(-25deg)}`,
  'dm-half': `${BASE('dm-half')}
[data-ui="dm-half"]{background:linear-gradient(90deg,#fde68a 50%,#1e1b4b 50%)!important;border:2px solid #111827!important;overflow:hidden}
[data-ui="dm-half"]::before{content:"";position:absolute;inset:0;background:${SUN('%23b45309')} 22% 50%/32% no-repeat,${MOON()} 78% 50%/32% no-repeat}
html.dark [data-ui="dm-half"]{transform:rotate(180deg)}`,
  'dm-flip': `${BASE('dm-flip')}
[data-ui="dm-flip"]{background:#fff!important;border:1px solid #e5e7eb!important;transform-style:preserve-3d;perspective:200px}
[data-ui="dm-flip"]::before{content:"";position:absolute;inset:25%;background:${SUN()} center/contain no-repeat;${T}}
html.dark [data-ui="dm-flip"]{background:#111827!important;border-color:#374151!important}
html.dark [data-ui="dm-flip"]::before{background-image:${MOON()};transform:rotateY(360deg)}`,
  'dm-glass': `${BASE('dm-glass')}
[data-ui="dm-glass"]{background:rgba(255,255,255,.35)!important;border:1px solid rgba(255,255,255,.7)!important;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 4px 16px rgba(15,23,42,.12)}
[data-ui="dm-glass"]::before{content:"";position:absolute;top:3px;left:3px;height:calc(100% - 6px);aspect-ratio:1;border-radius:50%;background:rgba(255,255,255,.85) ${SUN()} center/60% no-repeat;${T}}
html.dark [data-ui="dm-glass"]{background:rgba(15,23,42,.45)!important;border-color:rgba(255,255,255,.18)!important}
html.dark [data-ui="dm-glass"]::before{left:calc(100% - 3px);transform:translateX(-100%);background:rgba(30,41,59,.9) ${MOON()} center/60% no-repeat}`,
  'dm-neon': `${BASE('dm-neon')}
[data-ui="dm-neon"]{background:#fff!important;border:2px solid #f59e0b!important;box-shadow:0 0 10px rgba(245,158,11,.45)}
[data-ui="dm-neon"]::before{content:"";position:absolute;top:3px;left:3px;height:calc(100% - 6px);aspect-ratio:1;border-radius:50%;background:#f59e0b;box-shadow:0 0 10px #f59e0b;${T}}
html.dark [data-ui="dm-neon"]{background:#020617!important;border-color:#22d3ee!important;box-shadow:0 0 12px rgba(34,211,238,.7)}
html.dark [data-ui="dm-neon"]::before{left:calc(100% - 3px);transform:translateX(-100%);background:#22d3ee;box-shadow:0 0 12px #22d3ee}`,
  'dm-line': `${BASE('dm-line')}
[data-ui="dm-line"]{background:transparent!important}
[data-ui="dm-line"]::after{content:"";position:absolute;left:0;right:0;top:50%;height:2px;margin-top:-1px;background:#d1d5db}
[data-ui="dm-line"]::before{content:"";position:absolute;top:50%;left:0;width:18px;height:18px;margin-top:-9px;border-radius:50%;background:#f59e0b;z-index:1;${T}}
html.dark [data-ui="dm-line"]::after{background:#475569}
html.dark [data-ui="dm-line"]::before{left:calc(100% - 18px);background:#818cf8}`,
  'dm-word': `${BASE('dm-word')}
[data-ui="dm-word"]{background:#fff!important;border:1px solid #d1d5db!important;font:700 14px/1 system-ui,sans-serif;color:#111827}
[data-ui="dm-word"]::before{content:"☀  Light";color:#111827}
html.dark [data-ui="dm-word"]{background:#111827!important;border-color:#374151!important}
html.dark [data-ui="dm-word"]::before{content:"☾  Dark";color:#f9fafb}`,
  'dm-bare': `${BASE('dm-bare')}
[data-ui="dm-bare"]{background:transparent!important;border:0!important}
[data-ui="dm-bare"]::before{content:"";position:absolute;inset:14%;background:${SUN('%23374151')} center/contain no-repeat;${T}}
[data-ui="dm-bare"]:hover::before{transform:rotate(30deg) scale(1.1)}
html.dark [data-ui="dm-bare"]::before{background-image:${MOON('%23e5e7eb')}}`,
};
