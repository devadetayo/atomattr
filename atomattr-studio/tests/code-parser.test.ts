import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCodeReport } from '../src/document/code-parser';
import type { Node } from '../src/document/types';

const all = (ns: Node[]): Node[] => ns.flatMap(n => [n, ...all(n.children || [])]);

test('a full HTML document drops head, script and style instead of importing them as text', () => {
  const { nodes, notes } = parseCodeReport('<!doctype html><html><head><title>T</title><style>.a{color:red}</style></head><body><main><h1>Hello</h1><script>alert(1)</script></main></body></html>');
  const texts = all(nodes).map(n => n.text).filter(Boolean);
  assert.deepEqual(texts, ['Hello']);
  assert.ok(notes.some(n => /script/.test(n)));
});

test('a > inside an attribute value does not end the tag', () => {
  const { nodes } = parseCodeReport('<a href="/x?a>b" aria-label="Go > there">Go</a>');
  const a = nodes[0];
  assert.equal(a.type, 'button'); assert.equal(a.href, '/x?a>b'); assert.equal(a.text, 'Go');
  assert.equal(a.attrs?.['aria-label'], 'Go > there');
});

test('semantic tags and ids survive', () => {
  const { nodes } = parseCodeReport('<nav id="top"><ul><li>One</li></ul></nav><footer>F</footer>');
  assert.equal(nodes[0].tag, 'nav'); assert.equal(nodes[0].attrs?.id, 'top');
  assert.equal(all(nodes).find(n => n.tag === 'li')?.tag, 'li'); assert.equal(nodes[1].tag, 'footer');
});

test('form controls become inputs; entities decode; svg is kept as an embed', () => {
  const { nodes } = parseCodeReport('<form action="/s"><input type="email" name="mail" placeholder="you@x.com"><textarea name="msg"></textarea><button type="submit">Send &amp; go&nbsp;now</button></form><svg viewBox="0 0 1 1"><path d="M0 0"/></svg>');
  const f = nodes[0]; assert.equal(f.type, 'form'); assert.equal(f.attrs?.action, '/s');
  const kinds = (f.children || []).map(c => c.type); assert.deepEqual(kinds, ['input', 'input', 'button']);
  assert.equal(f.children![0].field?.name, 'mail'); assert.match(f.children![2].text!, /Send & go now/);
  assert.equal(nodes[1].type, 'embed'); assert.match(nodes[1].html!, /<path/);
});

test('inline styles map where they can and are reported where they cannot', () => {
  const { nodes, notes } = parseCodeReport('<div style="display:flex;flex-direction:column;gap:24px;background:#eee;transform:rotate(3deg)"><p>x</p></div>');
  const d = nodes[0]; assert.equal(d.style.layout, 'flex'); assert.equal(d.style.dir, 'column'); assert.equal(d.style.gap, 24); assert.equal(d.style.fill, '#eee');
  assert.ok(notes.some(n => /inline style/.test(n)));
});

test('JSX: expressions are reported, string literals kept, unmatched closers counted', () => {
  const { nodes, notes } = parseCodeReport('<Box className="card" title={"Hi"} onClick={() => go()}><Txt>Text</Txt></Box></div>');
  assert.equal(nodes[0].attrs?.class, 'card'); assert.equal(nodes[0].attrs?.title, 'Hi');
  assert.ok(notes.some(n => /onClick/.test(n))); assert.ok(notes.some(n => /no matching opener/.test(n)));
});
