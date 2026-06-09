'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import en from './translations/en';
import ta from './translations/ta';
import kn from './translations/kn';

export type Locale = 'en' | 'ta' | 'kn';

const TRANSLATIONS = { en, ta, kn } as const;

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ta: 'தமிழ்',
  kn: 'ಕನ್ನಡ',
};

type Translations = typeof en;

type DeepKeyOf<T extends object, Prefix extends string = ''> = {
  [K in keyof T]: T[K] extends object
    ? DeepKeyOf<T[K], `${Prefix}${Prefix extends '' ? '' : '.'}${K & string}`>
    : `${Prefix}${Prefix extends '' ? '' : '.'}${K & string}`;
}[keyof T];

type I18nContextType = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  localeLabels: Record<Locale, string>;
};

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => undefined,
  t: (key) => key,
  localeLabels: LOCALE_LABELS,
});

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return path;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === 'string' ? cur : path;
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

export function I18nProvider({ children, defaultLocale = 'en' }: { children: ReactNode; defaultLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dat_locale') as Locale | null;
      if (stored && stored in TRANSLATIONS) return stored;
    }
    return defaultLocale;
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== 'undefined') localStorage.setItem('dat_locale', l);
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    const translations = TRANSLATIONS[locale] as unknown as Record<string, unknown>;
    const str = getNestedValue(translations, key);
    return interpolate(str, vars);
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, localeLabels: LOCALE_LABELS }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export { LOCALE_LABELS };
