import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { kindOf, sniff, markdownToHtml, textToHtml, jsxToHtml, docxToHtml } from '../src/state/import-convert';

test('kinds by name and by content', () => {
  assert.equal(kindOf('App.tsx'), 'jsx'); assert.equal(kindOf('a.CSS'), 'css'); assert.equal(kindOf('x.docx'), 'docx'); assert.equal(kindOf('p.atomattr.json'), 'project'); assert.equal(kindOf('x.bin'), 'unknown');
  assert.equal(sniff('<svg viewBox="0 0 1 1"></svg>'), 'svg'); assert.equal(sniff('export default function A(){ return <div className="a"/> }'), 'jsx');
  assert.equal(sniff('.a { color: red; }'), 'css'); assert.equal(sniff('# Title\n\n- one'), 'md'); assert.equal(sniff('const x = 1; document.title = "a"'), 'js'); assert.equal(sniff('<div>hi</div>'), 'html');
});

test('markdown becomes headings, lists, links, tables and code', () => {
  const h = markdownToHtml('# Hi\n\nSome **bold** and `code` and [a link](https://x.io).\n\n- one\n- two\n\n1. a\n2. b\n\n> quote\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n```\n<b>raw</b>\n```');
  assert.match(h, /<h1>Hi<\/h1>/); assert.match(h, /<strong>bold<\/strong>/); assert.match(h, /<code>code<\/code>/); assert.match(h, /<a href="https:\/\/x.io">a link<\/a>/);
  assert.match(h, /<ul><li>one<\/li><li>two<\/li><\/ul>/); assert.match(h, /<ol><li>a<\/li><li>b<\/li><\/ol>/); assert.match(h, /<blockquote>/); assert.match(h, /<th>A<\/th>/); assert.match(h, /&lt;b&gt;raw/);
  assert.match(textToHtml('one\nline\n\ntwo'), /<p>one<br>line<\/p>\n<p>two<\/p>/);
});

test('react markup: class, style, text, lists, components in the same file', () => {
  const r = jsxToHtml(`
import './app.css';
function Hero({ title }) { return (<section className="hero" style={{ padding: 24, fontWeight: 700, background: '#eef' }}><h1>{title}</h1><button onClick={go} className={'btn ' + (on ? 'on' : '')}>Start</button></section>); }
const items = ['a','b'];
export default function App() {
  return (
    <>
      {/* a comment */}
      <Hero title="Hi" />
      <ul>{items.map(i => <li key={i}>{i}</li>)}</ul>
      <a href="/x" target="_blank">Go</a><img src="/p.png" alt="p" /><input type="email" placeholder="you@x.io" />
      <p>Count: {count} and {'literal'}</p>
    </>
  );
}`);
  assert.match(r.html, /<section class="hero" style="padding:24px;font-weight:700;background:#eef">/);
  assert.match(r.html, /<h1>\{title\}<\/h1>/); assert.match(r.html, /<button class="btn on">Start<\/button>/);
  assert.equal((r.html.match(/<li>/g) || []).length, 3); assert.doesNotMatch(r.html, /onClick|comment/);
  assert.match(r.html, /<a href="\/x" target="_blank">Go<\/a>/); assert.match(r.html, /<img src="\/p.png" alt="p">/); assert.match(r.html, /placeholder="you@x.io"/); assert.match(r.html, /Count: \{count\} and literal/);
  assert.deepEqual(r.components, ['Hero', 'App']);
});

test('docx: headings, bold, lists, links, tables', async () => {
  (globalThis as any).DOMParser = new JSDOM('').window.DOMParser;
  const { default: JSZip } = await import('jszip'); const z = new JSZip();
  const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
  z.file('word/document.xml', `<w:document ${W}><w:body>
    <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Title</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Bold</w:t></w:r><w:r><w:t xml:space="preserve"> plain </w:t></w:r><w:hyperlink r:id="rId9"><w:r><w:t>link</w:t></w:r></w:hyperlink></w:p>
    <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Item</w:t></w:r></w:p>
    <w:tbl><w:tr><w:tc><w:p><w:r><w:t>Cell</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>`);
  z.file('word/_rels/document.xml.rels', `<Relationships><Relationship Id="rId9" Target="https://x.io" Type="hyperlink"/></Relationships>`);
  const { html } = await docxToHtml(await z.generateAsync({ type: 'uint8array' }));
  assert.match(html, /<h1>Title<\/h1>/); assert.match(html, /<strong>Bold<\/strong> plain <a href="https:\/\/x.io">link<\/a>/); assert.match(html, /<ul><li>Item<\/li><\/ul>/); assert.match(html, /<td>Cell<\/td>/);
});
