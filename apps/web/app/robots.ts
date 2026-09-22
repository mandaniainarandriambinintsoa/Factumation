import type { MetadataRoute } from 'next';

import { getSiteUrl } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/auth/',
        '/fr/dashboard',
        '/en/dashboard',
        '/fr/settings',
        '/en/settings',
        '/fr/invoices/',
        '/en/invoices/',
        '/fr/quotes/',
        '/en/quotes/',
        '/fr/clients/',
        '/en/clients/',
        '/fr/companies/',
        '/en/companies/',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
