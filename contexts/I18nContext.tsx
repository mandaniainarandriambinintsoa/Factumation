import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import frMessages from '../i18n/fr.json';
import enMessages from '../i18n/en.json';

export type Locale = 'fr' | 'en';

const messages: Record<Locale, Record<string, any>> = {
  fr: frMessages,
  en: enMessages,
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function getNestedValue(obj: Record<string, any>, path: string): string {
  const keys = path.split('.');
  let current: any = obj;
  for (const key of keys) {
    if (current === undefined || current === null) return path;
    current = current[key];
  }
  return typeof current === 'string' ? current : path;
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const params = useParams<{ lang?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const langFromUrl = params.lang as Locale | undefined;
  const validLang = langFromUrl === 'fr' || langFromUrl === 'en' ? langFromUrl : null;

  const [locale, setLocaleState] = useState<Locale>(() => {
    if (validLang) return validLang;
    const stored = localStorage.getItem('factumation-lang') as Locale | null;
    if (stored === 'fr' || stored === 'en') return stored;
    const browserLang = navigator.language.slice(0, 2);
    return browserLang === 'en' ? 'en' : 'fr';
  });

  // Sync locale when URL lang param changes
  useEffect(() => {
    if (validLang && validLang !== locale) {
      setLocaleState(validLang);
      localStorage.setItem('factumation-lang', validLang);
    }
  }, [validLang]);

  // Update html lang attribute
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('factumation-lang', newLocale);

    // Replace the lang prefix in the current URL
    const currentPath = location.pathname;
    const langPrefixRegex = /^\/(fr|en)(\/|$)/;
    const match = currentPath.match(langPrefixRegex);
    if (match) {
      const restOfPath = currentPath.replace(langPrefixRegex, '/');
      navigate(`/${newLocale}${restOfPath === '/' ? '' : restOfPath}${location.search}${location.hash}`, { replace: true });
    } else {
      navigate(`/${newLocale}${currentPath}${location.search}${location.hash}`, { replace: true });
    }
  }, [navigate, location]);

  const t = useCallback((key: string): string => {
    return getNestedValue(messages[locale], key);
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
