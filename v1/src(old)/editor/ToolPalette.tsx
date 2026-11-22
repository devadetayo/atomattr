import { Box, Btn, Stack } from 'atomattr/react';
import { TOOLS, TOOL_MIME } from '../registry/tools';
import type { Mode, ToolDef, ToolGroup, ToolId } from '../registry/tools';
import { BAR, I, Rule, toolIcon } from './Studio-Ui';

type Props = { mode: Mode; activeTool: ToolId; onToolSelect: (tool: ToolId) => void; codeOpen: boolean; onToggleCode: () => void };

const GROUP_ORDER: ToolGroup[] = ['Select', 'Shapes', 'Content', 'Effects', 'View'];

function RailTool({ tool, mode, active, onSelect }: { tool: ToolDef; mode: Mode; active: boolean; onSelect: (id: ToolId) => void }) {
  const draggable = !!tool.insert && !tool.disabled;
  return (
    <Btn type="button" draggable={draggable} aria-pressed={active} aria-disabled={tool.disabled || undefined}
      title={`${tool.label}${tool.keys[mode] ? ` (${tool.keys[mode]!.toUpperCase()})` : ''} · ${tool.hint}`}
      onClick={() => { if (!tool.disabled) onSelect(tool.id); }}
      onDragStart={(event: React.DragEvent) => { event.dataTransfer.setData(TOOL_MIME, tool.id); event.dataTransfer.effectAllowed = 'copy'; }}
      display="flex" flex-col items="center" justify="center" gap="1" w="full" py="2" px="1" rounded="lg" border="none" fontSize="xs"
      bg={active ? 'primary' : 'transparent'} text={active ? 'white' : 'muted'}
      hover-bg={active ? 'primary' : 'gray-100'} dark-hover-bg={active ? 'primary' : 'gray-800'}
      opacity={tool.disabled ? '0.35' : '1'} cursor={tool.disabled ? 'not-allowed' : 'pointer'}>
      <Box as="span" display="flex" aria-hidden="true">{toolIcon(tool.id)}</Box>
      <Box as="span" lineHeight="tight" textAlign="center">{tool.label}</Box>
    </Btn>
  );
}

/** Dark vertical rail: icon above label, grouped by job. Click or press the shortcut to arm a tool; drag an insert tool onto the canvas to drop it there. */
export function ToolPalette({ mode, activeTool, onToolSelect, codeOpen, onToggleCode }: Props) {
  const tools = TOOLS.filter(tool => tool.modes.includes(mode));
  const groups = GROUP_ORDER.map(group => tools.filter(tool => tool.group === group)).filter(list => list.length > 0);
  return (
    <Stack as="nav" aria-label="Tools" {...BAR} border-r="1px solid gray-200" gap="1" p="2" w="20" flex="none" overflow="auto">
      {groups.map((list, index) => (
        <Stack key={list[0].group} gap="1" w="full">
          {index > 0 && <Rule />}
          {list.map(tool => <RailTool key={tool.id} tool={tool} mode={mode} active={activeTool === tool.id} onSelect={onToolSelect} />)}
        </Stack>
      ))}
      <Rule />
      <Btn type="button" onClick={onToggleCode} aria-pressed={codeOpen} title="Code View · open or close the code drawer"
        display="flex" flex-col items="center" justify="center" gap="1" w="full" py="2" px="1" rounded="lg" border="none" fontSize="xs"
        bg={codeOpen ? 'primary/15' : 'transparent'} text={codeOpen ? 'primary' : 'muted'}
        hover-bg={codeOpen ? 'primary/20' : 'gray-100'} dark-hover-bg={codeOpen ? 'primary/20' : 'gray-800'}>
        <Box as="span" display="flex" aria-hidden="true">{I.code}</Box>
        <Box as="span" lineHeight="tight">Code View</Box>
      </Btn>
    </Stack>
  );
}
