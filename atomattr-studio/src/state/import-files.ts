import { kindOf, sniff, markdownToHtml, textToHtml, jsxToHtml, docxToHtml, DOC_CSS, type Kind } from './import-convert';
import { importHtml } from './html-import';
import { addNode, toast, getState } from './store';
import { setProjectCustom, importCollectionCsv } from './cms-actions';
import { importSvg } from '../document/svg-import';

export type ImportResult = { name: string; kind: Kind; ok: boolean; message: string };
export type ImportInput = { name: string; kind: Kind; text?: string; data?: ArrayBuffer };

export const KIND_LABEL: Record<Kind, string> = { html: 'HTML', css: 'CSS', js: 'JavaScript', jsx: 'React (JSX / TSX)', md: 'Markdown', txt: 'Text', docx: 'Word', svg: 'SVG', csv: 'CSV (to Data)', project: 'Studio project', unknown: 'Unknown' };
export const ACCEPT = '.html,.htm,.css,.js,.mjs,.jsx,.tsx,.md,.markdown,.txt,.docx,.svg,.csv,.tsv,.json,.ast';

const stem = (n: string) => n.replace(/\.[^.]+$/, '');
const append = (prev: string | undefined, name: string, body: string, c: '/*' | '//') => {
  const tag = c === '/*' ? `/* Imported from ${name} */` : `// Imported from ${name}`;
  return `${prev?.trim() ? prev.trimEnd() + '\n\n' : ''}${tag}\n${body.trim()}\n`;
};

/** Reads dropped or picked files. Binary ones (Word, project archives) stay as bytes; the rest as text. */
export async function readFiles(files: File[]): Promise<ImportInput[]> {
  return Promise.all(files.map(async f => {
    const kind = kindOf(f.name);
    if (kind === 'docx' || (kind === 'project' && f.name.toLowerCase().endsWith('.ast'))) return { name: f.name, kind, data: await f.arrayBuffer() };
    return { name: f.name, kind: kind === 'unknown' && f.name.toLowerCase().endsWith('.json') ? 'project' as Kind : kind, text: await f.text() };
  }));
}
export const readPasted = (text: string, name = 'Pasted'): ImportInput => ({ name, kind: sniff(text), text });

/**
 * Imports a batch. Stylesheets that arrive together with HTML or React are used to style that import (so Tailwind-free class names
 * look right); a stylesheet on its own is added to the project's custom CSS.
 */
export async function importInputs(inputs: ImportInput[]): Promise<ImportResult[]> {
  const out: ImportResult[] = []; const css = inputs.filter(i => i.kind === 'css' && i.text);
  const pages = inputs.filter(i => ['html', 'jsx', 'md', 'txt', 'docx'].includes(i.kind));
  const styleFor = css.map(c => c.text).join('\n');
  for (const i of inputs) {
    const r = (ok: boolean, message: string) => out.push({ name: i.name, kind: i.kind, ok, message });
    try {
      if (i.kind === 'html') {
        const scripts = (i.text!.match(/<script\b/gi) || []).length;
        const n = await importHtml(i.text!, stem(i.name), styleFor);
        r(n > 0, n > 0 ? `${n} objects.${scripts ? ` ${scripts} script${scripts > 1 ? 's' : ''} not run: drop the .js file to add it as site code.` : ''}${css.length ? '' : ' Linked stylesheets only apply if you drop them together with the HTML.'}` : 'Nothing importable found.');
      } else if (i.kind === 'jsx') {
        const j = jsxToHtml(i.text!);
        if (!j.html.trim()) { r(false, 'No JSX markup found.'); continue; }
        const n = await importHtml(`<!doctype html><body>${j.html}</body>`, stem(i.name), styleFor);
        r(n > 0, n > 0 ? `${n} objects from <${j.components.length ? j.components[j.components.length - 1] : 'markup'}>. Only the static markup comes across: state, props and logic are dropped (${j.dropped} expression${j.dropped === 1 ? '' : 's'} skipped).${styleFor ? '' : ' Drop the .css file together with it to keep its styling.'}` : 'Nothing importable found.');
      } else if (i.kind === 'md' || i.kind === 'txt') {
        const n = await importHtml(`<!doctype html><body>${i.kind === 'md' ? markdownToHtml(i.text!) : textToHtml(i.text!)}</body>`, stem(i.name), DOC_CSS + '\n' + styleFor);
        r(n > 0, n > 0 ? `${n} objects.` : 'The file is empty.');
      } else if (i.kind === 'docx') {
        const d = await docxToHtml(i.data!);
        const n = await importHtml(`<!doctype html><body>${d.html}</body>`, stem(i.name), DOC_CSS);
        r(n > 0, n > 0 ? `${n} objects${d.images ? `, ${d.images} picture${d.images > 1 ? 's' : ''}` : ''}. Fonts, columns and headers/footers are not carried over.` : 'The document is empty.');
      } else if (i.kind === 'css') {
        if (pages.length) { r(true, 'Used to style the page imported with it.'); continue; }
        setProjectCustom({ css: append(getState().project?.custom?.css, i.name, i.text!, '/*') }); r(true, 'Added to your site CSS (Code panel, CSS). It styles the exported site; the canvas shows it too.');
      } else if (i.kind === 'js') {
        setProjectCustom({ js: append(getState().project?.custom?.js, i.name, i.text!, '//') }); r(true, 'Added to your site JavaScript. It runs on the exported site, never inside the editor.');
      } else if (i.kind === 'svg') {
        addNode(importSvg(i.text!, stem(i.name))); r(true, 'Added as an editable vector.');
      } else if (i.kind === 'csv') {
        const id = importCollectionCsv(stem(i.name), i.text!); r(!!id, id ? 'Added as a collection in Data.' : 'Could not read that CSV.');
      } else if (i.kind === 'project') {
        r(false, 'This is a project file: use File → Open project.');
      } else r(false, 'Not a supported file type.');
    } catch { r(false, 'Could not read this file.'); }
  }
  const good = out.filter(x => x.ok).length;
  if (out.length) toast(good === out.length ? `Imported ${good} file${good === 1 ? '' : 's'}.` : `Imported ${good} of ${out.length}. See the import window for details.`, good ? undefined : 'error');
  return out;
}
