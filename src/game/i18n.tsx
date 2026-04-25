import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { en } from './translations/en';
import { zh } from './translations/zh';
import { ru } from './translations/ru';
import { uk } from './translations/uk';

export type Locale = 'en' | 'zh' | 'ru' | 'uk';
type TranslationMap = Record<string, string>;
const translations: Record<Locale, TranslationMap> = { en, zh, ru, uk };

const STORAGE_KEY = 'dcw.locale';

function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && translations[stored]) return stored;
    const nav = (window.navigator.language || 'en').toLowerCase();
    if (nav.startsWith('zh')) return 'zh';
    if (nav.startsWith('uk')) return 'uk';
    if (nav.startsWith('ru')) return 'ru';
  } catch { /* ignore */ }
  return 'en';
}

function interpolate(template: string, ...args: (string | number)[]): string {
  return template.replace(/\{(\d+)\}/g, (_, i) => String(args[Number(i)] ?? ''));
}

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, ...args: (string | number)[]) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { window.localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const t = useCallback((key: string, ...args: (string | number)[]): string => {
    const val = translations[locale]?.[key] ?? translations.en[key] ?? key;
    return args.length > 0 ? interpolate(val, ...args) : val;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be inside I18nProvider');
  return ctx;
}

export const AVAILABLE_LOCALES: { code: Locale; label: string; nativeLabel: string; flag: string }[] = [
  { code: 'en', label: 'English',   nativeLabel: 'English',   flag: '🇬🇧' },
  { code: 'zh', label: 'Chinese',   nativeLabel: '中文',       flag: '🇨🇳' },
  { code: 'ru', label: 'Russian',   nativeLabel: 'Русский',   flag: '🇷🇺' },
  { code: 'uk', label: 'Ukrainian', nativeLabel: 'Українська', flag: '🇺🇦' },
];
