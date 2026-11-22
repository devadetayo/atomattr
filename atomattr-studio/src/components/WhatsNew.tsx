import { useEffect, useRef, useState } from 'react';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import { APP_VERSION, KIND_LABEL, KIND_ORDER, RELEASES, readAck, shouldAutoShow, writeAck, type Release } from '../state/releases';
import { ToolIcon } from './ToolIcons';
import { T } from '../theme';

/** Per-kind tint for the small icon tile. Colours come from the theme palette, light and dark. */
const TINT = {
  feature: { bg: 'primary/15', text: 'primary' },
  improvement: { bg: 'sky-500/15', text: 'sky-500' },
  fix: { bg: 'emerald-500/15', text: 'emerald-500' },
} as const;

function Notes({ r }: { r: Release }) {
  return (
    <Box display="flex" flex-col gap="4">
      {KIND_ORDER.map(kind => {
        const items = r.notes.filter(n => n.kind === kind); if (!items.length) return null;
        return (
          <Box key={kind} as="section" aria-label={KIND_LABEL[kind]}>
            <Txt as="h3" fontSize="sm" fontWeight="700" m="0" mb="2" {...T.muted}>{KIND_LABEL[kind].toUpperCase()}</Txt>
            <Box as="ul" m="0" p="0" display="flex" flex-col gap="2" list-style="none">
              {items.map(n => (
                <Row as="li" key={n.title} items="start" gap="3" p="3" {...T.tile}>
                  <Box w="30px" h="30px" shrink="0" rounded="8px" display="flex" items="center" justify="center" bg={TINT[kind].bg} text={TINT[kind].text} aria-hidden="true"><ToolIcon n={n.icon} size={16} /></Box>
                  <Box flex="1" min-w="0">
                    <Txt as="p" fontSize="sm" fontWeight="600" m="0" {...T.text}>{n.title}</Txt>
                    <Txt as="p" fontSize="sm" m="0" mt="1" leading="snug" {...T.muted}>{n.text}</Txt>
                  </Box>
                </Row>
              ))}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

/**
 * The What's New dialog. Opened automatically once per version (see useWhatsNewAutoOpen), or from Help > What's new.
 * `modal: 'whats-new'` shows the newest release with Dismiss / Explore updates; the previous releases sit under it in a list.
 */
export function WhatsNewModal() {
  const s = useStudio(); void s;
  const [open, setOpen] = useState<string>(RELEASES[0].version);
  const latest = RELEASES[0]; const older = RELEASES.slice(1);
  const close = () => { writeAck(APP_VERSION); S.setState({ modal: null }); };
  const explore = () => {
    writeAck(APP_VERSION);
    S.setState({ modal: s.screen === 'editor' ? 'shortcuts' : null });
  };
  const primary = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    window.addEventListener('keydown', k, true);
    const t = setTimeout(() => primary.current?.focus(), 0);
    return () => { window.removeEventListener('keydown', k, true); clearTimeout(t); };
  }, []);

  return (
    <Box position="fixed" top="0" left="0" w="100%" h="100%" z="100" display="flex" items="center" justify="center" p="3" {...T.overlay} animate="studio-fade 140ms ease-out both" onPointerDown={close}>
      <Box {...T.dialog} w="min(520px, 100%)" max-h="min(680px, 92vh)" display="flex" flex-col overflow="hidden" role="dialog" aria-modal="true" aria-labelledby="wn-title"
        animate="studio-pop 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both" onPointerDown={(e: React.PointerEvent) => e.stopPropagation()} onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}>
        <Row items="start" gap="3" px="5" pt="5" pb="3" shrink="0">
          <Box w="40px" h="40px" shrink="0" rounded="lg" display="flex" items="center" justify="center" bg="primary/15" text="primary" aria-hidden="true"><ToolIcon n="sparkle" size={22} /></Box>
          <Box flex="1" min-w="0">
            <Row items="center" gap="2">
              <Txt as="h2" id="wn-title" fontSize="16px" fontWeight="700" m="0" {...T.text}>What’s new</Txt>
              <Txt as="span" fontSize="sm" fontWeight="600" m="0" px="2" py="1px" rounded="full" bg="primary/15" text="primary">v{latest.version}</Txt>
            </Row>
            <Txt fontSize="sm" m="0" mt="1" {...T.muted}>{latest.date ? `${latest.headline} · ${latest.date}` : latest.headline}</Txt>
          </Box>
          <Btn type="button" title="Close (Esc)" aria-label="Close" onClick={close} w="28px" h="28px" p="0" display="flex" items="center" justify="center" rounded="lg" border="0" cursor="pointer" shrink="0" bg="transparent" {...T.hover} {...T.text}><ToolIcon n="close" size={18} /></Btn>
        </Row>
        <Box flex="1" min-h="0" overflow="auto" px="5" pb="3">
          <Notes r={latest} />
          {older.length > 0 && (
            <Box as="section" aria-label="Previous releases" mt="5">
              <Txt as="h3" fontSize="sm" fontWeight="700" m="0" mb="2" {...T.muted}>PREVIOUS RELEASES</Txt>
              {older.map(r => {
                const on = open === r.version;
                return (
                  <Box key={r.version} mb="2" {...T.tile}>
                    <Btn type="button" aria-expanded={on} aria-controls={`wn-${r.version}`} onClick={() => setOpen(on ? '' : r.version)} w="100%" h="36px" px="3" display="flex" items="center" gap="2" text-align="left" rounded="lg" border="1px solid" border-color="transparent" focus-border-color="primary" bg="transparent" cursor="pointer" {...T.hover} {...T.text}>
                      <Txt as="span" fontSize="sm" fontWeight="700" m="0">v{r.version}</Txt>
                      <Txt as="span" fontSize="sm" m="0" flex="1" truncate {...T.muted}>{r.date ? `${r.headline} · ${r.date}` : r.headline}</Txt>
                      <ToolIcon n={on ? 'collapse' : 'chevron'} size={16} />
                    </Btn>
                    {on && <Box id={`wn-${r.version}`} px="3" pb="3" pt="1"><Notes r={r} /></Box>}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
        <Row justify="end" items="center" gap="2" px="4" py="3" shrink="0">
          <Btn type="button" onClick={close} h="32px" px="4" rounded="lg" border="1px solid" border-color="transparent" focus-border-color="primary" bg="transparent" {...T.hover} {...T.text} fontSize="sm" fontWeight="600" cursor="pointer">Dismiss</Btn>
          <Btn ref={primary} type="button" onClick={explore} h="32px" px="4" rounded="lg" border="1px solid" border-color="transparent" focus-border-color="white" bg="primary" text="white" fontSize="sm" fontWeight="600" cursor="pointer">Explore updates</Btn>
        </Row>
      </Box>
    </Box>
  );
}

/** Opens What's New once per version, a moment after the app is up and only when nothing else is in the way. */
export function useWhatsNewAutoOpen() {
  useEffect(() => {
    if (!shouldAutoShow(readAck())) return;
    const t = setTimeout(() => { if (S.getState().modal === null && !S.getState().commandOpen) S.setState({ modal: 'whats-new' }); }, 1200);
    return () => clearTimeout(t);
  }, []);
}
