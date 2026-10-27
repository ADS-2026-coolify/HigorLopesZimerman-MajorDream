import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, translations, TranslationKey } from './translations';

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('draftarena_lang');
    return (saved === 'en' || saved === 'pt-BR') ? saved : 'pt-BR';
  });

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('draftarena_lang', l);
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let str: string = translations[locale][key] || translations['pt-BR'][key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`{${k}}`, 'g'), String(v));
      });
    }
    return str;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};
