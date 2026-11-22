/* Template checkout. Not wired to a payment provider yet.
   To connect it, set window.ATOMATTR_CHECKOUT_URL to your server endpoint. It receives
     POST { id, email }   and must answer   { "url": "https://checkout.stripe.com/..." }   (or { "error": "message" })
   and this file redirects the buyer to that url. A template may instead carry a fixed "checkout" link
   (a Stripe Payment Link, Lemon Squeezy, Gumroad...) in templates/premium.json, which is used when no endpoint is set.
   With neither, the button records the email for a launch notice (stored in this browser, or POSTed to ATOMATTR_NOTIFY_URL). */
export async function startCheckout(id, email, msgEl) {
  const say = (t) => { if (msgEl) msgEl.textContent = t; };
  const list = await fetch('templates/templates.json').then((r) => r.json()).catch(() => []);
  const t = list.find((x) => x.id === id) || {};
  const ep = window.ATOMATTR_CHECKOUT_URL;
  if (ep) {
    if (!/^\S+@\S+\.\S+$/.test(email || '')) return say('Enter a valid email so we can send your files.');
    say('Opening secure checkout...');
    try {
      const r = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, email }) });
      const d = await r.json();
      if (d.url) { location.href = d.url; return; }
      say(d.error || 'Checkout is unavailable right now. Try again soon.');
    } catch { say('Could not reach checkout. Check your connection and try again.'); }
    return;
  }
  if (t.checkout) { location.href = t.checkout; return; }
  if (!/^\S+@\S+\.\S+$/.test(email || '')) return say('Enter your email and we will tell you when it is out.');
  const n = window.ATOMATTR_NOTIFY_URL;
  try {
    if (n) await fetch(n, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, email }) });
    else { const k = 'atomattr-notify'; const o = JSON.parse(localStorage.getItem(k) || '[]'); o.push({ id, email }); localStorage.setItem(k, JSON.stringify(o)); }
  } catch { /* ignore */ }
  say('Thanks. We will email you when this template is available.');
}
