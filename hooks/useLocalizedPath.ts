import { useCallback } from 'react';
import { useI18n } from '../contexts/I18nContext';

export const useLocalizedPath = () => {
  const { locale } = useI18n();

  const path = useCallback((rawPath: string): string => {
    // Ensure path starts with /
    const cleanPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    // Don't double-prefix if already has lang prefix
    if (/^\/(fr|en)(\/|$)/.test(cleanPath)) return cleanPath;
    return `/${locale}${cleanPath === '/' ? '' : cleanPath}`;
  }, [locale]);

  return { path };
};
