import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { blogPosts, type BlogPost } from './blog-posts';
import { getPublicEnvironment } from './env';

type BlogRow = {
  slug: string;
  lang: 'fr' | 'en';
  title: string;
  excerpt: string;
  content: string;
  keywords: string[] | null;
  author: string | null;
  published_at: string | null;
  read_time: number | null;
  image: string | null;
};

const columns = 'slug,lang,title,excerpt,content,keywords,author,published_at,read_time,image';

function publicClient() {
  const environment = getPublicEnvironment();
  return createClient(environment.supabaseUrl, environment.supabasePublishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function fromRow(row: BlogRow): BlogPost {
  return {
    slug: row.slug,
    lang: row.lang,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    keywords: row.keywords ?? [],
    author: row.author ?? 'Factumation',
    date: row.published_at ?? new Date(0).toISOString(),
    readTime: row.read_time ?? 5,
    ...(row.image ? { image: row.image } : {}),
  };
}

export async function getPublishedPosts(locale: 'fr' | 'en'): Promise<BlogPost[]> {
  const fallback = blogPosts.filter((post) => post.lang === locale);
  try {
    const { data, error } = await publicClient()
      .from('blog_posts')
      .select(columns)
      .eq('published', true)
      .eq('lang', locale)
      .order('published_at', { ascending: false });
    if (error || !data?.length) return fallback;
    return (data as BlogRow[]).map(fromRow);
  } catch {
    return fallback;
  }
}

export async function getPublishedPost(
  locale: 'fr' | 'en',
  slug: string,
): Promise<BlogPost | undefined> {
  try {
    const { data, error } = await publicClient()
      .from('blog_posts')
      .select(columns)
      .eq('published', true)
      .eq('lang', locale)
      .eq('slug', slug)
      .maybeSingle();
    if (!error && data) return fromRow(data as BlogRow);
  } catch {
    // Static content remains available if the CMS is unreachable.
  }
  return blogPosts.find((post) => post.lang === locale && post.slug === slug);
}
