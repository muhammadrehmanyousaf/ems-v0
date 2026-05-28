'use client';

/**
 * Phase 2 #8.9 — Add-to-home-screen prompt.
 *
 * Three install paths:
 *   - Chromium browsers fire `beforeinstallprompt` — we stash it,
 *     show a banner, and call .prompt() on click.
 *   - iOS Safari has no programmatic install — we detect iOS,
 *     show a "Share → Add to Home Screen" hint instead.
 *   - Already-installed PWAs (running in standalone display-mode)
 *     skip the banner entirely.
 *
 * Dismissals stick for 14 days via localStorage so we don't nag.
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { X, Download, Share, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'ww:pwa-dismissed-until';
const DISMISS_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
// Show the banner at most once per 24h even when the user neither installs nor
// explicitly dismisses it (just navigates away). Without this, the browser's
// `beforeinstallprompt` re-fires the banner on every full page load — far too
// naggy. An explicit dismiss still wins with the longer 14-day window above.
const SHOWN_KEY = 'ww:pwa-shown-at';
const SHOWN_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const match = window.matchMedia?.('(display-mode: standalone)').matches;
  // @ts-ignore — Safari only
  const ios = window.navigator.standalone;
  return !!(match || ios);
}

function isDismissed(): boolean {
  try {
    const until = Number(localStorage.getItem(DISMISS_KEY) || '0');
    return until && Date.now() < until ? true : false;
  } catch {
    return false;
  }
}

function dismiss(): void {
  try {
    localStorage.setItem(
      DISMISS_KEY,
      String(Date.now() + DISMISS_WINDOW_MS),
    );
  } catch {
    // ignore
  }
}

function recentlyShown(): boolean {
  try {
    const at = Number(localStorage.getItem(SHOWN_KEY) || '0');
    return at && Date.now() - at < SHOWN_COOLDOWN_MS ? true : false;
  } catch {
    return false;
  }
}

function markShown(): void {
  try {
    localStorage.setItem(SHOWN_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || isDismissed() || recentlyShown()) return;

    const beforeInstallHandler = (e: Event) => {
      e.preventDefault();
      // Always stash the event so Install works if/when we show the banner,
      // but only surface it (and start the 24h cooldown) if we haven't shown
      // it recently and the user hasn't dismissed it.
      setDeferred(e as BeforeInstallPromptEvent);
      if (!recentlyShown() && !isDismissed()) {
        markShown();
        setVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', beforeInstallHandler);

    if (isIos()) {
      // iOS doesn't fire the install event — show the manual hint after
      // a short delay so the user has time to interact with the page
      // first (avoids the modal feeling pushy on first paint).
      const t = setTimeout(() => {
        if (!isDismissed() && !recentlyShown()) {
          markShown();
          setShowIosHint(true);
          setVisible(true);
        }
      }, 8000);
      return () => {
        clearTimeout(t);
        window.removeEventListener(
          'beforeinstallprompt',
          beforeInstallHandler,
        );
      };
    }

    return () =>
      window.removeEventListener('beforeinstallprompt', beforeInstallHandler);
  }, []);

  const onInstall = async () => {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
    if (outcome === 'dismissed') dismiss();
  };

  const onDismiss = () => {
    dismiss();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      className="fixed inset-x-2 bottom-2 z-50 sm:left-auto sm:right-4 sm:bottom-4 sm:w-[360px] rounded-xl border border-bridal-beige bg-white shadow-lg p-3 flex items-start gap-3"
    >
      <div className="h-9 w-9 rounded-full bg-bridal-gold/15 text-bridal-gold-dark flex items-center justify-center shrink-0">
        <Smartphone className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="text-sm font-semibold text-neutral-900">
          Install Wedding Wala
        </p>
        {showIosHint ? (
          <p className="text-xs text-neutral-600 leading-relaxed">
            Tap{' '}
            <Share className="inline h-3 w-3 align-text-bottom" /> then{' '}
            <span className="font-medium">Add to Home Screen</span> so the app
            opens like a native app on your phone.
          </p>
        ) : (
          <p className="text-xs text-neutral-600 leading-relaxed">
            Add it to your home screen for offline-capable bookings, day-of
            timeline, and push notifications.
          </p>
        )}
        <div className="flex items-center gap-2 pt-1">
          {!showIosHint && deferred && (
            <Button
              type="button"
              size="sm"
              className="h-7 gap-1.5"
              onClick={onInstall}
            >
              <Download className="h-3.5 w-3.5" />
              Install
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7"
            onClick={onDismiss}
          >
            Not now
          </Button>
        </div>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="h-6 w-6 text-neutral-400 hover:text-neutral-700 shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
