import React from 'react';
import { useI18n, Locale } from '../contexts/I18nContext';
import { Globe } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { locale, setLocale } = useI18n();

  const toggleLocale = () => {
    const newLocale: Locale = locale === 'fr' ? 'en' : 'fr';
    setLocale(newLocale);
  };

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-primary-900 hover:bg-slate-100 transition-colors"
      title={locale === 'fr' ? 'Switch to English' : 'Passer en Français'}
    >
      <Globe size={16} />
      <span className="uppercase">{locale === 'fr' ? 'EN' : 'FR'}</span>
    </button>
  );
};

export default LanguageSwitcher;
