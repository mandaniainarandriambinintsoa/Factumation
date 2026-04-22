
import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Shield, FileText, ArrowRight, Users, Building2, History, Mail, LogIn } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
import SEOHead from './SEOHead';

const About: React.FC = () => {
  const { t } = useI18n();
  const { path } = useLocalizedPath();

  return (
    <div className="bg-white">
      <SEOHead title={t('seo.aboutTitle')} description={t('seo.aboutDescription')} path="/about" />
      {/* Hero Section */}
      <div className="bg-primary-900 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold sm:text-5xl mb-6">{t('about.title')}</h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto leading-relaxed">
            {t('about.subtitle')}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">

        {/* Intro & Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">{t('about.innovationTitle')}</h2>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              {t('about.innovationDesc')}
            </p>
            <ul className="space-y-4">
              {[
                { icon: FileText, text: t('about.feature1') },
                { icon: Zap, text: t('about.feature2') },
                { icon: Mail, text: t('about.feature3') },
                { icon: Shield, text: t('about.feature4') },
              ].map((item, index) => (
                <li key={index} className="flex items-center text-slate-700">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center mr-4">
                    <item.icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <span className="font-medium">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-primary-200 rounded-2xl transform rotate-3 scale-95 opacity-50"></div>
            <div className="relative bg-slate-50 p-8 rounded-2xl shadow-lg border border-slate-100">
              <div className="space-y-6">
                <div className="h-2 w-1/3 bg-slate-200 rounded"></div>
                <div className="h-2 w-2/3 bg-slate-200 rounded"></div>
                <div className="h-32 bg-white rounded border border-slate-200 p-4 flex items-center justify-center text-slate-400">
                  {t('about.previewInvoice')}
                </div>
                <div className="flex justify-between">
                  <div className="h-8 w-24 bg-primary-100 rounded"></div>
                  <div className="h-8 w-24 bg-slate-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features with Account */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <LogIn className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">{t('about.accountFeaturesTitle')}</h2>
            <p className="mt-4 text-slate-500 max-w-2xl mx-auto">
              {t('about.accountFeaturesSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Users,
                title: t('about.clientBook'),
                description: t('about.clientBookDesc'),
                color: "text-blue-600",
                bg: "bg-blue-50"
              },
              {
                icon: Building2,
                title: t('about.multiCompany'),
                description: t('about.multiCompanyDesc'),
                color: "text-indigo-600",
                bg: "bg-indigo-50"
              },
              {
                icon: History,
                title: t('about.historyFeature'),
                description: t('about.historyFeatureDesc'),
                color: "text-amber-600",
                bg: "bg-amber-50"
              },
              {
                icon: Mail,
                title: t('about.emailFeature'),
                description: t('about.emailFeatureDesc'),
                color: "text-green-600",
                bg: "bg-green-50"
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-300">
                <div className={`w-12 h-12 ${feature.bg} rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              {t('about.quickLogin')}
            </p>
          </div>
        </div>

        {/* Mission CTA */}
        <div className="bg-slate-900 rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary-500 rounded-full opacity-20 filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-purple-500 rounded-full opacity-20 filter blur-3xl"></div>

          <div className="relative z-10 py-16 px-8 md:px-16 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">{t('about.ctaTitle')}</h2>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto text-lg">
              {t('about.ctaSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to={path('/create')}
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-slate-900 rounded-full font-semibold hover:bg-slate-100 transition-colors"
              >
                {t('hero.createInvoice')}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link
                to={path('/quote')}
                className="inline-flex items-center justify-center px-8 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-400 transition-colors"
              >
                {t('hero.createQuote')}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default About;
