import 'atomattr/defaults.css';
import './styles.css';
import { createRoot } from 'react-dom/client';
import { Workspace } from './components/Workspace';
import { initStorage, migrateLegacyStorage } from './state/storage';
import * as S from './state/store';
import { CrashGuard } from './components/CrashGuard';
import { installErrorLog } from './state/diagnostics';

const host = document.getElementById('root');
if (host) {
  const splash = document.createElement('div');
  splash.id = 'app-splash';
  splash.setAttribute('aria-live', 'polite');
  splash.setAttribute('aria-busy', 'true');
  splash.innerHTML = '<img src="/logo-studio.png" alt="AtomAttr Studio loading" />';
  host.parentElement?.insertBefore(splash, host);

  const root = createRoot(host);
  // Render straight away; the recents list fills in as soon as storage answers, and old data is migrated afterwards.
  installErrorLog();
  root.render(<CrashGuard><Workspace /></CrashGuard>);
  void initStorage().then(() => { S.setState({ recentsTick: Date.now() }); return migrateLegacyStorage(); }).then(moved => { if (moved) S.setState({ recentsTick: Date.now() }); }).catch(() => {});

  const hideSplash = () => {
    splash.classList.add('is-hidden');
    window.setTimeout(() => splash.remove(), 350);
  };

  if (document.readyState === 'complete') {
    window.setTimeout(hideSplash, 700);
  } else {
    window.addEventListener('load', () => window.setTimeout(hideSplash, 700), { once: true });
  }
}
