import { startEngine } from './engine/engine.js';

// Auto-start in browser environment
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startEngine);
    } else {
        startEngine();
    }
}

// Export 'start' explicitly so window.AtomAttr.start() works
export const start = startEngine;