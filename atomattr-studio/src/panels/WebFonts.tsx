import { useState } from 'react';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import { pickFile } from '../state/assets';
import { uid } from '../document/tree';
import { FAMILY_OK, WEIGHTS, WEIGHT_NAME, familyValue, formatOf, googleHref, isHttps, type WebFont } from '../document/fonts';
import { IconBtn, Seg } from '../components/ui';
import { T } from '../theme';

/* Web fonts: Google Fonts by name, any stylesheet URL, or an uploaded file. Added fonts appear in the Family list. */

const POPULAR = ['Inter', 'Poppins', 'Montserrat', 'Playfair Display', 'Lora', 'Space Grotesk', 'DM Serif Display', 'JetBrains Mono'];
const FILE_LIMIT = 1_500_000;
const input = { h: '30px', px: '2', fontSize: 'sm', 'min-w': '0', ...T.field } as const;

export function WebFonts() {
  const s = useStudio(); const p = s.project!; const fonts = p.webFonts || [];
  const [mode, setMode] = useState<'google' | 'css' | 'file'>('google');
  const [name, setName] = useState(''); const [url, setUrl] = useState(''); const [weights, setWeights] = useState<number[]>([400, 700]); const [busy, setBusy] = useState(false);
  const save = (next: WebFont[]) => S.setProject({ ...p, webFonts: next }, { history: true });
  const has = (family: string) => fonts.some(f => f.family.toLowerCase() === family.toLowerCase());

  const addGoogle = async (raw = name) => {
    const family = raw.trim().replace(/ +/g, ' ');
    if (!FAMILY_OK.test(family)) { S.toast('Use the font name as it appears on fonts.google.com, like “Space Grotesk”.', 'error'); return; }
    if (has(family)) { S.toast(`${family} is already added.`); return; }
    const font: WebFont = { id: uid(), family, kind: 'google', weights: [...weights].sort((a, b) => a - b) };
    setBusy(true);
    try { const r = await fetch(googleHref([font])); if (!r.ok) { S.toast(`Google Fonts has no family called “${family}” with those weights.`, 'error'); return; } }
    catch { S.toast('Could not reach Google Fonts to check the name. Added anyway.'); }
    finally { setBusy(false); }
    save([...fonts, font]); setName(''); S.toast(`${family} added. Pick it in the Family list.`);
  };
  const addCss = () => {
    const family = name.trim();
    if (!FAMILY_OK.test(family)) { S.toast('Enter the font-family name the stylesheet defines.', 'error'); return; }
    if (!isHttps(url.trim())) { S.toast('The stylesheet address must start with https://', 'error'); return; }
    if (has(family)) { S.toast(`${family} is already added.`); return; }
    save([...fonts, { id: uid(), family, kind: 'css', url: url.trim() }]); setName(''); setUrl(''); S.toast(`${family} added.`);
  };
  const addFile = async () => {
    const f = await pickFile('.woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf'); if (!f) return;
    const format = formatOf(f.name); if (!format) { S.toast('Use a .woff2, .woff, .ttf or .otf file.', 'error'); return; }
    if (f.size > FILE_LIMIT) { S.toast('That font file is over 1.5 MB. Subset it, or use a stylesheet link instead.', 'error'); return; }
    const family = (name.trim() || f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')).replace(/[^A-Za-z0-9 _-]/g, '').trim();
    if (!FAMILY_OK.test(family)) { S.toast('Give the font a simple family name first.', 'error'); return; }
    if (has(family)) { S.toast(`${family} is already added. Use a different name for another weight.`); return; }
    const dataUrl = await new Promise<string>(res => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(f); });
    save([...fonts, { id: uid(), family, kind: 'file', dataUrl, format, weights: [weights.length === 1 ? weights[0] : 400] }]); setName(''); S.toast(`${family} added and saved inside the project.`);
  };
  const toggleW = (w: number) => setWeights(a => (a.includes(w) ? (a.length > 1 ? a.filter(x => x !== w) : a) : [...a, w]));
  const kindLabel = (f: WebFont) => (f.kind === 'google' ? `Google · ${(f.weights || []).join(', ')}` : f.kind === 'css' ? 'Stylesheet' : 'Uploaded file');

  return <Box display="flex" flex-col gap="2">
    <Seg value={mode} onChange={setMode} options={[{ v: 'google', label: 'Google' }, { v: 'css', label: 'Link' }, { v: 'file', label: 'File' }]} />
    <Box as="input" value={name} placeholder={mode === 'google' ? 'Font name, e.g. Space Grotesk' : mode === 'css' ? 'Family name in the stylesheet' : 'Family name (optional)'} aria-label="Font family name" spellCheck={false}
      onChange={(e: any) => setName(e.target.value)} onKeyDown={(e: React.KeyboardEvent) => { e.stopPropagation(); if (e.key === 'Enter' && mode === 'google') addGoogle(); }} {...input} />
    {mode === 'css' && <Box as="input" value={url} placeholder="https://fonts.bunny.net/css?family=…" aria-label="Stylesheet address" spellCheck={false} onChange={(e: any) => setUrl(e.target.value)} onKeyDown={(e: React.KeyboardEvent) => { e.stopPropagation(); if (e.key === 'Enter') addCss(); }} {...input} />}
    {mode !== 'css' && <Box display="flex" flex-col gap="1">
      <Txt fontSize="sm" fontWeight="600" m="0" {...T.label}>{mode === 'file' ? 'Weight of this file' : 'Weights to load'}</Txt>
      <Box display="grid" grid-cols="3" gap="1" role="group" aria-label={mode === 'file' ? 'Weight of this file' : 'Weights to load'}>
        {WEIGHTS.map(w => { const on = weights.includes(w);
          return <Btn key={w} type="button" aria-pressed={on} title={`${WEIGHT_NAME[w]} ${w}`} onClick={() => (mode === 'file' ? setWeights([w]) : toggleW(w))} display="flex" flex-col items="center" gap="0" py="1" min-w="0" border="1px solid" cursor="pointer" rounded="10px"
            {...(on ? { bg: 'primary/10', 'dark-bg': 'primary/20', 'border-color': 'primary' } : { bg: 'gray-900/5', 'dark-bg': 'white/6', 'border-color': 'transparent', 'hover-bg': 'gray-900/9' })}>
            <Txt fontSize="lg" fontWeight={String(w)} leading="tight" m="0" {...(on ? { text: 'primary', 'dark-text': 'white' } : T.text)}>Aa</Txt>
            <Txt fontSize="sm" leading="tight" m="0" w="100%" truncate text-align="center" {...T.muted}>{w} {WEIGHT_NAME[w]}</Txt>
          </Btn>; })}
      </Box>
    </Box>}
    {mode === 'google' && <Row gap="1" wrap>{POPULAR.filter(f => !has(f)).map(f => <Btn key={f} type="button" onClick={() => setName(f)} h="24px" px="2" border="0" rounded="full" cursor="pointer" fontSize="sm" bg="gray-900/5" dark-bg="white/6" hover-bg="gray-900/10" dark-hover-bg="white/10" {...T.muted}>{f}</Btn>)}</Row>}
    <Btn type="button" disabled={busy} onClick={mode === 'google' ? () => addGoogle() : mode === 'css' ? addCss : addFile} h="30px" px="3" border="0" rounded="lg" cursor="pointer" bg="primary" text="white" fontSize="sm" fontWeight="600">{busy ? 'Checking…' : mode === 'file' ? 'Choose font file' : 'Add font'}</Btn>
    <Txt fontSize="sm" leading="snug" m="0" {...T.muted}>{mode === 'google' ? 'Loaded from Google Fonts on the page, so visitors need a connection.' : mode === 'css' ? 'Any https stylesheet that defines the family.' : 'WOFF2 is smallest. The file is saved inside the project and every exported page, up to 1.5 MB.'}</Txt>

    {fonts.map(f => <Row key={f.id} items="center" gap="2" p="2" {...T.card}>
      <Txt fontSize="lg" m="0" shrink="0" w="28px" text-align="center" {...T.text} font-family={familyValue(f)}>Ag</Txt>
      <Box flex="1" min-w="0"><Txt display="block" fontSize="sm" fontWeight="600" m="0" truncate {...T.text}>{f.family}</Txt><Txt display="block" fontSize="sm" m="0" truncate {...T.muted}>{kindLabel(f)}</Txt></Box>
      <IconBtn icon="trash" title={`Remove ${f.family}`} size={26} iconSize={14} danger onClick={() => save(fonts.filter(x => x.id !== f.id))} />
    </Row>)}
  </Box>;
}
