'use client';

/**
 * Phase 3 #9.4 — Language toggle.
 *
 * Two-button segmented control: EN | اردو. Persists via useLocale's
 * localStorage handling. Wired into the dashboard layout's header.
 */

import * as React from 'react';
import { useLocale } from '@/lib/i18n/useT';
import { cn } from '@/lib/utils';

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  // BUG-032 — the اردو toggle set `lang="ur"` (and persisted it) but never
  // translated the dashboard: only ~5 of ~200 screens read the i18n dictionary,
  // so the UI stayed English/Roman-Urdu and `dir` stayed ltr. Shipping a
  // prominent control that does nothing misleads the Urdu-preferring vendors this
  // product targets. Hide it until the i18n coverage is real; flip this flag on
  // when the dictionary + RTL are wired across the portal.
  const I18N_READY = false;
  if (!I18N_READY) return null;

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border bg-muted/40 p-0.5 text-xs',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={cn(
          'h-6 px-2 rounded transition-colors',
          locale === 'en'
            ? 'bg-background shadow-sm font-medium text-foreground'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale('ur')}
        className={cn(
          'h-6 px-2 rounded transition-colors font-[Noto_Nastaliq_Urdu]',
          locale === 'ur'
            ? 'bg-background shadow-sm font-medium text-foreground'
            : 'text-muted-foreground hover:text-foreground',
        )}
        style={{ fontFamily: '"Noto Nastaliq Urdu", serif' }}
      >
        اردو
      </button>
    </div>
  );
}
