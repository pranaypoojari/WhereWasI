'use client';
import { useEffect } from 'react';

// Registers /sw.js after the page is idle so it never competes with LCP. Production only:
// a dev-mode worker would serve stale HMR bundles.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // Registration failures (private mode, blocked storage) just mean no offline mode.
      });
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
