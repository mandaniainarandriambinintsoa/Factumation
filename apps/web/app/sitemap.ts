import type { MetadataRoute } from 'next';

import { blogPosts } from '@/lib/blog-posts';
import { getSiteUrl } from '@/lib/env';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const staticRoutes = ['', '/pricing', '/about', '/contact', '/blog'];
  const pages = (['fr', 'en'] as const).flatMap((locale) =>
    staticRoutes.map((path) => ({
      url: `${base}/${locale}${path}`,
      changeFrequency: path === '' ? ('weekly' as const) : ('monthly' as const),
      priority: path === '' ? 1 : 0.7,
    })),
  );
  const articles = blogPosts.map((post) => ({
    url: `${base}/${post.lang}/blog/${post.slug}`,
    lastModified: post.date,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));
  return [...pages, ...articles];
}
