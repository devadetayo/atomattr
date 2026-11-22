import test from 'node:test';
import assert from 'node:assert/strict';

import { getFallbackIconSvg, getIconSvgDataUrl } from '../src/panels/icon-fallback';
import { patchStyle } from '../src/document/style';

test('fallback icon SVG is generated for unavailable remote asset icons', () => {
  const homeSvg = getFallbackIconSvg('lucide:home');
  const fallbackSvg = getFallbackIconSvg('lucide:unknown-icon');

  assert.match(homeSvg, /<svg[^>]*viewBox="0 0 24 24"/i);
  assert.match(homeSvg, /stroke="currentColor"/i);
  assert.match(homeSvg, /<path[^>]*d=/i);
  assert.doesNotMatch(fallbackSvg, /M12 5v14M5 12h14/);

  const dataUrl = getIconSvgDataUrl('lucide:home');
  assert.match(dataUrl, /^data:image\/svg\+xml;charset=utf-8,/i);
});

test('switching shadow preset clears custom CSS shadow', () => {
  const next = patchStyle({ id: 'n1', type: 'container', name: 'Card', style: { shadowCss: '0 0 8px rgba(0,0,0,0.4)' } } as any, { shadow: 'md' }, 'desktop');
  assert.equal(next.style.shadowCss, undefined);
  assert.equal(next.style.shadow, 'md');

  const cleared = patchStyle({ id: 'n2', type: 'container', name: 'Card', style: { shadowCss: '0 0 8px rgba(0,0,0,0.4)' } } as any, { shadow: 'none' }, 'desktop');
  assert.equal(cleared.style.shadowCss, undefined);
  assert.equal(cleared.style.shadow, 'none');
});
