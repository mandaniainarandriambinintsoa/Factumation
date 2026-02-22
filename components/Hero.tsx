import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
import SEOHead from './SEOHead';

const Hero: React.FC = () => {
  const { t } = useI18n();
  const { path } = useLocalizedPath();

  return (
    <div className="bg-slate-50 overflow-hidden">
      <SEOHead title={t('seo.homeTitle')} description={t('seo.homeDescription')} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-primary-950 mb-6">
            {t('hero.title')} <span className="text-primary-500">{t('hero.titleHighlight')}</span>.
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to={path('/create')}
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-full text-white bg-primary-900 hover:bg-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              {t('hero.createInvoice')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to={path('/quote')}
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-full text-white bg-primary-500 hover:bg-primary-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              {t('hero.createQuote')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          <div className="mt-4">
            <Link
              to={path('/about')}
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-primary-900 hover:text-primary-700 transition-colors"
            >
              {t('hero.learnMore')}
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-slate-500">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              {t('hero.free')}
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              {t('hero.noCard')}
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              {t('hero.webhook')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
