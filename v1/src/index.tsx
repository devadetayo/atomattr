import 'atomattr/defaults.css';
import { createRoot } from 'react-dom/client';
import { Workspace } from './components/Workspace';

const host = document.getElementById('root');
if (host) createRoot(host).render(<Workspace />);
