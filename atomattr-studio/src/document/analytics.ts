/**
 * Analytics for exported sites.
 *
 * The Studio has no server, so it does not collect or show visitor data itself. It adds a small loader to exported pages
 * that sends page views and tagged click events to the service you choose (Plausible, Google Analytics 4, Umami) or to
 * your own endpoint. No cookies are set by the custom endpoint option, and "Respect Do Not Track" skips everything for
 * visitors who ask not to be tracked. Studio previews never run it.
 */
export type AnalyticsProvider = 'none' | 'plausible' | 'ga4' | 'umami' | 'custom';
export type Analytics = { provider: AnalyticsProvider; id: string; src?: string; respectDnt?: boolean };
export const EVENT_ATTR = 'data-ast-event';

export const ANALYTICS_PROVIDERS: { id: AnalyticsProvider; label: string; field: string; placeholder: string; hint: string }[] = [
  { id: 'none', label: 'Off', field: '', placeholder: '', hint: 'Exported pages send nothing.' },
  { id: 'plausible', label: 'Plausible', field: 'Site domain', placeholder: 'example.com', hint: 'Privacy-friendly, cookie-free. Add the domain in your Plausible account first.' },
  { id: 'ga4', label: 'Google Analytics 4', field: 'Measurement ID', placeholder: 'G-XXXXXXXXXX', hint: 'Uses Google cookies; you may need a consent banner where the law requires it.' },
  { id: 'umami', label: 'Umami', field: 'Website ID', placeholder: '00000000-0000-0000-0000-000000000000', hint: 'Open-source and cookie-free. Use your own script URL if you self-host.' },
  { id: 'custom', label: 'Your own endpoint', field: 'Endpoint URL', placeholder: 'https://example.com/collect', hint: 'Receives a small JSON POST per page view or event: type, name, path, referrer, screen width, time. No cookies.' },
];

const httpsUrl = (u: string) => /^https:\/\/[^\s"'<>\\]+$/i.test(u);
export function analyticsProblem(a?: Analytics): string {
  if (!a || a.provider === 'none') return ''; const id = (a.id || '').trim(); if (!id) return 'Required.';
  if (a.src && !httpsUrl(a.src.trim())) return 'The script URL must start with https://';
  switch (a.provider) {
    case 'plausible': return /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}(\/[\w./-]*)?$/i.test(id) ? '' : 'Enter a domain like example.com.';
    case 'ga4': return /^G-[A-Z0-9]{4,}$/.test(id) ? '' : 'A GA4 ID looks like G-ABC123XYZ.';
    case 'umami': return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? '' : 'An Umami website ID is a UUID.';
    case 'custom': return httpsUrl(id) ? '' : 'Use a full https:// URL.';
  }
  return '';
}

/** Escapes JSON for safe use inside an inline <script>. */
const js = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\u2028|\u2029/g, '');

/** The `<script>` that loads the provider and wires tagged clicks. Empty when off or invalid, so a bad setting never ships. */
export function analyticsHead(a?: Analytics): string {
  if (!a || a.provider === 'none' || analyticsProblem(a)) return '';
  const cfg = js({ p: a.provider, id: a.id.trim(), src: (a.src || '').trim(), dnt: a.respectDnt !== false });
  return `<script>(function(){var C=${cfg};
if(C.dnt&&(navigator.doNotTrack==='1'||window.doNotTrack==='1'))return;
function load(src,attrs){var s=document.createElement('script');s.async=true;s.src=src;for(var k in attrs)s.setAttribute(k,attrs[k]);document.head.appendChild(s);}
var track=function(){};
if(C.p==='plausible'){window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)};load(C.src||'https://plausible.io/js/script.js',{'data-domain':C.id,defer:''});track=function(n){window.plausible(n)};}
else if(C.p==='ga4'){window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('config',C.id);load('https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(C.id));track=function(n){window.gtag('event',n)};}
else if(C.p==='umami'){load(C.src||'https://cloud.umami.is/script.js',{'data-website-id':C.id,defer:''});track=function(n){if(window.umami)window.umami.track(n)};}
else if(C.p==='custom'){var send=function(t,n){var d=JSON.stringify({type:t,name:n||'',path:location.pathname,referrer:document.referrer,width:window.innerWidth,time:Date.now()});if(navigator.sendBeacon)navigator.sendBeacon(C.id,new Blob([d],{type:'application/json'}));else fetch(C.id,{method:'POST',body:d,keepalive:true,headers:{'Content-Type':'application/json'}});};send('pageview');track=function(n){send('event',n)};}
document.addEventListener('click',function(e){var t=e.target.closest&&e.target.closest('[${EVENT_ATTR}]');if(t)track(t.getAttribute('${EVENT_ATTR}'));});
})();</script>`;
}
