import { Component, type ReactNode } from 'react';
import { buildReport, projectBackupJson, recordError } from '../state/diagnostics';
import { download } from '../exporters/zip';
import { saveNow } from '../state/store';

/** Last line of defence: if the editor crashes, show a calm screen that keeps the person's work reachable. Plain HTML and inline styles, so it cannot fail the same way. */
export class CrashGuard extends Component<{ children: ReactNode }, { failed: boolean; copied: boolean }> {
  state = { failed: false, copied: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(e: unknown) { recordError(e); try { saveNow(); } catch { /* storage may be what failed */ } }
  backup = () => { const j = projectBackupJson(); if (j) download(new Blob([j], { type: 'application/json' }), `studio-backup-${Date.now()}.json`); };
  copy = async () => { try { await navigator.clipboard.writeText(buildReport('The editor crashed.')); this.setState({ copied: true }); } catch { /* clipboard blocked */ } };
  render() {
    if (!this.state.failed) return this.props.children;
    const btn = (primary: boolean): React.CSSProperties => ({ font: '600 14px system-ui', padding: '10px 16px', borderRadius: 12, border: primary ? '0' : '1px solid #d1d5db', background: primary ? '#4f46e5' : '#fff', color: primary ? '#fff' : '#111827', cursor: 'pointer' });
    return <div role="alert" style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', padding: 24, background: '#f9fafb', color: '#111827', font: '16px/1.5 system-ui' }}>
      <div style={{ maxWidth: 460 }}>
        <h1 style={{ font: '700 24px system-ui', margin: '0 0 8px' }}>Something went wrong</h1>
        <p style={{ margin: '0 0 8px' }}>Studio hit an error and stopped. Your work was saved in this browser a moment ago.</p>
        <p style={{ margin: '0 0 20px', color: '#6b7280' }}>Reload to carry on. If it happens again, download a backup first and send us the details.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" style={btn(true)} onClick={() => location.reload()}>Reload</button>
          <button type="button" style={btn(false)} onClick={this.backup}>Download project backup</button>
          <button type="button" style={btn(false)} onClick={this.copy}>{this.state.copied ? 'Details copied' : 'Copy error details'}</button>
        </div>
      </div>
    </div>;
  }
}
