'use client';

/**
 * Phase 2 #8.9 — Service-worker registrar.
 *
 * Runs once on the client. Registers /sw.js, listens for activation
 * so a fresh deploy doesn't strand users on the old shell, and emits
 * a one-line console line so ops can confirm the SW is alive without
 * having to dig into DevTools.
 *
 * Safe no-op:
 *   - Disabled in development (Next.js HMR + SW are incompatible)
 *   - Skipped when `navigator.serviceWorker` is undefined (e.g. iOS
 *     in non-secure context, locked-down browsers)
 *   - Skipped when env NEXT_PUBLIC_PWA_DISABLED === "1"
 */

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (process.env.NEXT_PUBLIC_PWA_DISABLED === '1') return;
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          // eslint-disable-next-line no-console
          console.log('[pwa] sw registered, scope:', reg.scope);

          // If a new SW is found, swap in immediately on next idle.
          reg.addEventListener('updatefound', () => {
            const next = reg.installing;
            if (!next) return;
            next.addEventListener('statechange', () => {
              if (
                next.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New version available — silently keep going so the
                // vendor's day isn't interrupted by a reload toast.
                // The next hard nav picks up the new SW.
              }
            });
          });
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.warn('[pwa] sw registration failed:', err?.message);
        });
    };

    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad, { once: true });
  }, []);

  return null;
}
