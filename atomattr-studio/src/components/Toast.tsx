import { useEffect, useState } from 'react';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import { ToolIcon } from './ToolIcons';
import { T } from '../theme';

const LIFETIME_MS = 3200; // keep in step with state/store.ts toast()
const EXIT_MS = 160;

/**
 * Toast: one frosted-glass message above the bottom bar. It rises in, counts down along its lower edge, and fades out
 * instead of vanishing. The store clears `toast` after 3.2 s; this host keeps the last message on screen for the exit.
 * Errors use role="alert" (announced at once) and a red-tinted glass.
 */
export function ToastHost() {
  const t = useStudio().toast;
  const [shown, setShown] = useState(t);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (t) { setShown(t); setLeaving(false); return; }
    if (!shown) return;
    setLeaving(true);
    const id = setTimeout(() => { setShown(null); setLeaving(false); }, EXIT_MS);
    return () => clearTimeout(id);
  }, [t]);

  if (!shown) return null;
  const error = shown.kind === 'error';
  return (
    <Box position="fixed" left="0" bottom="56px" w="100%" z="120" display="flex" justify="center" px="3" pointer-events="none">
      <Row key={shown.id} role={error ? 'alert' : 'status'} aria-live={error ? 'assertive' : 'polite'} items="center" gap="3" position="relative" overflow="hidden"
        max-w="min(460px, 100%)" min-h="44px" pl="3" pr="2" py="2" pointer-events="auto" fontSize="sm"
        {...T.toast} {...(error ? T.toastError : {})}
        animate={leaving ? `studio-pop-out ${EXIT_MS}ms ease-in both` : 'studio-pop 200ms cubic-bezier(0.2, 0.8, 0.2, 1) both'}>
        <Box w="26px" h="26px" shrink="0" rounded="full" display="flex" items="center" justify="center" aria-hidden="true"
          bg={error ? 'danger' : 'primary/15'} text={error ? 'white' : 'primary'} dark-text={error ? 'white' : 'primary'}>
          <ToolIcon n={error ? 'close' : 'info'} size={15} />
        </Box>
        <Txt as="p" m="0" flex="1" min-w="0" fontSize="sm" fontWeight="500" leading="snug" {...T.text}>{shown.text}</Txt>
        <Btn type="button" title="Dismiss" aria-label="Dismiss message" onClick={() => S.setState({ toast: null })} w="26px" h="26px" p="0" display="flex" items="center" justify="center" rounded="full" border="0" cursor="pointer" shrink="0" bg="transparent" {...T.hover} {...T.muted}>
          <ToolIcon n="close" size={14} />
        </Btn>
        {!leaving && <Box position="absolute" left="0" bottom="0" w="100%" h="2px" bg={error ? 'danger' : 'primary'} opacity="0.55" transform-origin="left center" animate={`studio-countdown ${LIFETIME_MS}ms linear both`} aria-hidden="true" />}
      </Row>
    </Box>
  );
}
