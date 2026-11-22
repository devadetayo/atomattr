import { Box, Btn, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import * as A from '../state/scale-actions';
import { FIELD_LABEL, LINK_FIELDS, usageOfClass, usageOfToken } from '../document/scales';
import type { Node, ScaleKind, ScaleToken } from '../document/types';
import { IconBtn, NumField, Section, SelectField, TextField } from '../components/ui';
import { textDialog } from '../state/dialogs';
import { T } from '../theme';

const TITLES: Record<ScaleKind, string> = { space: 'Spacing tokens', radius: 'Radius tokens', shadow: 'Shadow tokens' };
const use = (id: string, roots: Node[]) => roots.reduce((c, r) => c + usageOfToken(r, id), 0);

function TokenRow({ t, roots }: { t: ScaleToken; roots: Node[] }) {
  const used = use(t.id, roots);
  return <Row items="center" gap="1">
    <Box w="84px" shrink="0"><TextField value={t.name} onCommit={v => A.updateScaleToken({ ...t, name: v.trim() || t.name })} /></Box>
    <Box flex="1" min-w="0">{t.kind === 'shadow'
      ? <TextField value={String(t.value)} onCommit={v => A.updateScaleToken({ ...t, value: v.trim() || t.value })} />
      : <NumField value={Number(t.value)} min={0} suffix="px" onCommit={v => A.updateScaleToken({ ...t, value: Math.max(0, v) })} />}</Box>
    <Txt fontSize="sm" m="0" w="20px" shrink="0" text-align="right" title={`${used} object${used === 1 ? '' : 's'} follow this token`} {...T.muted}>{used || ''}</Txt>
    <IconBtn icon="trash" title="Delete token (objects keep their values)" size={22} iconSize={12} danger onClick={() => A.deleteScaleToken(t.id)} />
  </Row>;
}

/** Spacing, radius and shadow token editors, and reusable style classes. Shown in the Styles panel. */
export function ScaleSections() {
  const s = useStudio(); const p = s.project!; const list = A.scaleOf(p); const classes = A.classesOf(p);
  const roots = [...p.pages.map(pg => pg.root), ...p.components.map(c => c.node)]; const sel = S.selNodes(s)[0];
  return <>
    {!list.length && <Box display="flex" flex-col gap="2" p="3" {...T.tile}>
      <Txt fontSize="sm" fontWeight="600" m="0" {...T.text}>Spacing, radius and shadow tokens</Txt>
      <Txt fontSize="sm" leading="snug" m="0" {...T.muted}>Name your sizes once, link objects to them, and change a token to update everything that follows it. Tokens are also exported as CSS variables.</Txt>
      <Btn type="button" onClick={A.addDefaultScale} h="30px" rounded="lg" border="0" cursor="pointer" fontSize="sm" fontWeight="600" bg="primary" text="white">Add default tokens</Btn>
    </Box>}
    {(['space', 'radius', 'shadow'] as ScaleKind[]).map(k => !!list.length && <Section key={k} title={TITLES[k]} open={k === 'space'} action={<IconBtn icon="plus" title={`Add ${TITLES[k].toLowerCase().replace(' tokens', '')} token`} size={22} iconSize={13} onClick={() => A.addScaleToken(k)} />}>
      <Box display="flex" flex-col gap="1">{list.filter(t => t.kind === k).map(t => <TokenRow key={t.id} t={t} roots={roots} />)}</Box>
    </Section>)}
    <Section title="Style classes" open={!!classes.length} action={<IconBtn icon="plus" title="New class from the selected object" size={22} iconSize={13} onClick={async () => { if (!sel) { S.toast('Select an object first.'); return; } const n = await textDialog({ title: 'New style class', label: 'Class name', value: '', required: true, confirmLabel: 'Create' }); if (n) A.createClassFromSelection(n); }} />}>
      {!classes.length && <Txt fontSize="sm" leading="snug" m="0" {...T.muted}>Select a styled object, then press + to save its look as a class. Apply it to other objects, and editing the class updates them all.</Txt>}
      {classes.map(c => { const used = roots.reduce((n, r) => n + usageOfClass(r, c.id), 0); return <Row key={c.id} items="center" gap="1" mb="1">
        <Box flex="1" min-w="0"><TextField value={c.name} onCommit={v => A.renameClass(c.id, v)} /></Box>
        <Txt fontSize="sm" m="0" w="20px" text-align="right" shrink="0" {...T.muted} title={`${used} object${used === 1 ? '' : 's'}`}>{used || ''}</Txt>
        <IconBtn icon="refresh" title="Update class from the selected object" size={22} iconSize={12} disabled={!sel} onClick={() => A.updateClassFromSelection(c.id)} />
        <IconBtn icon="trash" title="Delete class (objects keep their look)" size={22} iconSize={12} danger onClick={() => A.deleteClass(c.id)} />
      </Row>; })}
    </Section>
  </>;
}

/** In Properties: pick a token for padding, gap, radius and shadow, and a class for the whole look. */
export function TokenLinks({ node }: { node: Node }) {
  const s = useStudio(); const p = s.project!; const list = A.scaleOf(p); const classes = A.classesOf(p);
  if (!list.length && !classes.length) return <Txt fontSize="sm" leading="snug" m="0" px="3" py="2" {...T.muted}>Create tokens and classes in the Styles panel to link this object to them.</Txt>;
  const fields = (['pad', 'padX', 'padY', 'gap', 'radius', 'shadowCss'] as const).filter(f => LINK_FIELDS[f === 'radius' ? 'radius' : f === 'shadowCss' ? 'shadow' : 'space'].includes(f));
  return <Box display="flex" flex-col gap="2" px="3" py="2">
    {!!classes.length && <SelectField label="Style class" value={node.cls || ''} options={[['', 'None'], ...classes.map(c => [c.id, c.name] as [string, string])]} onChange={A.applyStyleClass} />}
    {!!list.length && <Box display="grid" grid-cols="2" gap="2">{fields.map(f => {
      const kind: ScaleKind = f === 'radius' ? 'radius' : f === 'shadowCss' ? 'shadow' : 'space';
      return <SelectField key={f} label={FIELD_LABEL[f]} value={node.style.tok?.[f] || ''} options={[['', 'None'], ...list.filter(t => t.kind === kind).map(t => [t.id, t.name] as [string, string])]} onChange={v => A.applyScaleToken(f, v)} />;
    })}</Box>}
  </Box>;
}
