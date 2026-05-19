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
            ? 'bg-background shadow-sm font-medium text-neutral-900'
            : 'text-neutral-500 hover:text-neutral-700',
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
            ? 'bg-background shadow-sm font-medium text-neutral-900'
            : 'text-neutral-500 hover:text-neutral-700',
        )}
        style={{ fontFamily: '"Noto Nastaliq Urdu", serif' }}
      >
        اردو
      </button>
    </div>
  );
}
