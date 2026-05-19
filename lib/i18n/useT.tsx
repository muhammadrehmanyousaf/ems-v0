'use client';

/**
 * Phase 3 #9.4 — Self-contained i18n hook.
 *
 * Tiny by design — no next-i18next, no SSR plumbing, no nested-key
 * resolution. Keys are dot-strings, values are flat strings, lookup
 * is a Map. Locale persists in localStorage; SSR fallback is always
 * "en" so server-rendered markup matches the initial paint.
 *
 * Usage:
 *   const t = useT();
 *   <button>{t("verb.save")}</button>
 *
 * Locale change:
 *   const { setLocale } = useLocale();
 *   setLocale("ur");
 */

import * as React from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { DICTIONARIES, type Locale } from './dictionary';

const STORAGE_KEY = 'ww:locale';
const DEFAULT_LOCALE: Locale = 'en';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'ur' || saved === 'en') {
        setLocaleState(saved);
      }
    } catch {
      // localStorage unavailable (private mode etc.) — stay on default.
    }
  }, []);

  // Apply lang + dir attributes whenever locale changes.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = locale;
    // Urdu is RTL; keep the dashboard layouts in LTR for now (mixed-
    // content tables would break otherwise). Hero-style public pages
    // can opt into dir="rtl" individually via this attribute.
    document.documentElement.setAttribute(
      'data-locale',
      locale,
    );
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}

/**
 * Lookup function returning the translated string for `key` in the
 * current locale, falling back to English then to the key itself.
 */
export function useT(): (key: string) => string {
  const { locale } = useLocale();
  return useCallback(
    (key: string) => {
      const dict = DICTIONARIES[locale] || {};
      if (key in dict) return dict[key];
      const en = DICTIONARIES.en || {};
      if (key in en) return en[key];
      return key;
    },
    [locale],
  );
}
