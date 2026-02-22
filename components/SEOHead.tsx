import { useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';

interface SEOHeadProps {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
}

const BASE_URL = 'https://factumation.vercel.app';

const SEOHead: React.FC<SEOHeadProps> = ({ title, description, path = '', ogImage }) => {
  const { locale } = useI18n();
  const altLocale = locale === 'fr' ? 'en' : 'fr';

  const canonicalUrl = `${BASE_URL}/${locale}${path}`;
  const altUrl = `${BASE_URL}/${altLocale}${path}`;

  useEffect(() => {
    // Title
    document.title = title;

    // Helper to set or create a meta tag
    const setMeta = (attr: string, attrValue: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${attrValue}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Helper to set or create a link tag
    const setLink = (rel: string, href: string, extra?: Record<string, string>) => {
      const selector = extra
        ? `link[rel="${rel}"][hreflang="${extra.hreflang || ''}"]`
        : `link[rel="${rel}"]:not([hreflang])`;
      let el = document.querySelector(selector) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        if (extra) {
          Object.entries(extra).forEach(([k, v]) => el!.setAttribute(k, v));
        }
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // Meta description
    setMeta('name', 'description', description);

    // Canonical
    setLink('canonical', canonicalUrl);

    // Hreflang
    setLink('alternate', `${BASE_URL}/${locale}${path}`, { hreflang: locale });
    setLink('alternate', `${BASE_URL}/${altLocale}${path}`, { hreflang: altLocale });
    setLink('alternate', `${BASE_URL}/fr${path}`, { hreflang: 'x-default' });

    // Open Graph
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:locale', locale === 'fr' ? 'fr_FR' : 'en_US');
    setMeta('property', 'og:locale:alternate', locale === 'fr' ? 'en_US' : 'fr_FR');
    if (ogImage) {
      setMeta('property', 'og:image', ogImage);
    }

    // Twitter
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);

    // HTML lang
    document.documentElement.lang = locale;
  }, [title, description, locale, canonicalUrl, altUrl, path, ogImage]);

  return null;
};

export default SEOHead;
