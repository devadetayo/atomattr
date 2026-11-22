import React from 'react';
import { createRoot } from 'react-dom/client';
import 'atomattr/defaults.css';
import { startAtomAttr } from 'atomattr';
import { App } from './App';

startAtomAttr();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
