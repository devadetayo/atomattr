import { useState } from 'react';
import type { ChangeEvent, KeyboardEvent as RKey } from 'react';
import { Box, Btn, Input, Row, Txt } from 'atomattr/react';
import type { StudioPage } from '../types/project';
import { BAR, I, IconButton } from './Studio-Ui';

type Props = {
  pages: StudioPage[]; activeId: string;
  onSelect: (id: string) => void; onAdd: () => void; onDuplicate: () => void; onDelete: () => void; onRename: (name: string) => void;
};

/** Docked page tabs along the bottom, CorelDRAW style. Double-click a tab to rename it. */
export function PageTabs({ pages, activeId, onSelect, onAdd, onDuplicate, onDelete, onRename }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const index = Math.max(0, pages.findIndex(page => page.id === activeId));
  const step = (by: number) => { const next = pages[index + by]; if (next) onSelect(next.id); };
  return (
    <Row as="nav" aria-label="Pages" {...BAR} border-t="1px solid gray-200" items="center" gap="2" px="2" h="10" flex="none" overflow="auto">
      <Row items="center" gap="1" flex="none">
        <IconButton label="Previous page" onClick={() => step(-1)} disabled={index <= 0} size="7">{I.chevronLeft}</IconButton>
        <Txt fontSize="xs" text="muted" m="0" whitespace="nowrap">{index + 1} of {pages.length}</Txt>
        <IconButton label="Next page" onClick={() => step(1)} disabled={index >= pages.length - 1} size="7">{I.chevronRight}</IconButton>
      </Row>
      <Box w="1px" h="5" bg="gray-200" dark-bg="gray-800" flex="none" />
      <Row items="end" gap="1" role="tablist" aria-label="Page tabs" minW="0">
        {pages.map(page => {
          const active = page.id === activeId;
          return editing === page.id && active ? (
            <Input key={page.id} aria-label="Page name" autoFocus value={page.name} w="32" px="2" py="1" fontSize="xs" rounded="md"
              bg="white" dark-bg="gray-950" border="1px solid primary" text="text"
              onChange={(e: ChangeEvent<HTMLInputElement>) => onRename(e.target.value)} onBlur={() => setEditing(null)}
              onKeyDown={(e: RKey<HTMLInputElement>) => { if (e.key === 'Enter' || e.key === 'Escape') setEditing(null); }} />
          ) : (
            <Btn key={page.id} type="button" role="tab" aria-selected={active} onClick={() => onSelect(page.id)} onDoubleClick={() => { onSelect(page.id); setEditing(page.id); }}
              title="Double-click to rename" px="3" py="1" rounded="md" border="none" fontSize="xs" whitespace="nowrap"
              bg={active ? 'primary/15' : 'transparent'} text={active ? 'primary' : 'muted'} fontWeight={active ? '700' : '500'}
              hover-bg={active ? 'primary/20' : 'gray-100'} dark-hover-bg={active ? 'primary/20' : 'gray-800'}>{page.name}</Btn>
          );
        })}
      </Row>
      <Row items="center" gap="1" flex="none">
        <IconButton label="Add page" onClick={onAdd} size="7">{I.plus}</IconButton>
        <IconButton label="Duplicate page" onClick={onDuplicate} size="7">{I.duplicate}</IconButton>
        <IconButton label="Delete page" onClick={() => { if (pages.length > 1 && window.confirm('Delete this page and its contents?')) onDelete(); }} disabled={pages.length <= 1} size="7">{I.trash}</IconButton>
      </Row>
    </Row>
  );
}
