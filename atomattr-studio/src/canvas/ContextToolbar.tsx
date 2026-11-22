import { Box, Row, Txt } from 'atomattr/react';
import type { Node, Rect } from '../document/types';
import * as S from '../state/store';
import { IconBtn } from '../components/ui';
import { T } from '../theme';
import { removePoint, toggleSmooth } from './pathops';
import { findParent } from '../document/tree';

export function ContextToolbar({ union, stage, sole }: { union: Rect; stage: { w: number; h: number }; sole: Node | null }) {
  const w = 300; const left = Math.max(28, Math.min(stage.w - w - 8, union.x + union.w / 2 - w / 2));
  const top = union.y > 90 ? union.y - 64 : union.y + union.h + 44;
  const s = S.getState(); const pick = s.pointPick;
  const editPts = (fn: (pts: NonNullable<Node['pts']>) => NonNullable<Node['pts']>) => { if (sole?.pts) S.replaceNode(sole.id, n => ({ ...n, pts: fn(n.pts!) })); };
  const nested = !!sole && !!(() => { const loc = findParent(S.root(s), sole.id); return loc && findParent(S.root(s), loc.parent.id); })();
  return (
    <Box position="absolute" left={`${left}px`} top={`${Math.max(26, top)}px`} z="30" onPointerDown={(e: React.PointerEvent) => e.stopPropagation()} {...T.panel} p="1">
      <Row items="center" gap="0">
        <Txt fontSize="sm" fontWeight="600" text="gray-500" dark-text="gray-300" m="0" px="2" whitespace="nowrap">
          {sole ? sole.type.charAt(0).toUpperCase() + sole.type.slice(1) : `${s.sel.length} objects`}
        </Txt>
        <Box w="1px" h="18px" mx="1" bg="gray-300" dark-bg="gray-600" />
        {sole?.type === 'section' && <IconBtn icon="plus" title="Add section below" onClick={() => S.addSection(sole.id)} />}
        {nested && <IconBtn icon="ungroup" title="Move out of container" onClick={() => S.moveOut([sole!.id])} />}
        <IconBtn icon="copy" title="Duplicate (Ctrl+D)" onClick={S.duplicateSelection} />
        <IconBtn icon="group" title="Group (Ctrl+G)" onClick={S.groupSelection} disabled={s.sel.length < 1} />
        <IconBtn icon="ungroup" title="Ungroup (Ctrl+Shift+G)" onClick={S.ungroupSelection} disabled={sole?.type !== 'group'} />
        <IconBtn icon="front" title="Bring to front" onClick={() => S.arrange('front')} />
        <IconBtn icon="back" title="Send to back" onClick={() => S.arrange('back')} />
        <IconBtn icon="lock" title="Lock" onClick={() => S.toggleFlag('locked')} />
        {sole?.type === 'shape' && <IconBtn icon="node" title="Convert to editable path" onClick={S.convertToPath} />}
        {sole?.type === 'path' && pick && <><IconBtn icon="smooth" title="Corner / smooth point" onClick={() => editPts(p => toggleSmooth(p, !!sole.closed, pick.index))} /><IconBtn icon="minus" title="Delete point" onClick={() => { editPts(p => removePoint(p, pick.index)); S.setState({ pointPick: null }); }} /></>}
        <IconBtn icon="trash" title="Delete" danger onClick={S.deleteSelection} />
      </Row>
    </Box>
  );
}
