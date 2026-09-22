import { ArrowRight, Clock3 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PublicShell } from '@/components/public-shell';
import { getPublishedPosts } from '@/lib/blog';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Guides pratiques sur la facturation et la gestion professionnelle.',
};
export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'fr' && locale !== 'en') notFound();
  const posts = await getPublishedPosts(locale);
  const copy =
    locale === 'fr'
      ? {
          eyebrow: 'Ressources',
          title: 'Le blog Factumation',
          intro: 'Conseils concrets pour facturer plus simplement et gérer votre activité.',
          read: 'Lire l’article',
        }
      : {
          eyebrow: 'Resources',
          title: 'The Factumation blog',
          intro: 'Practical advice to simplify invoicing and run your business.',
          read: 'Read the article',
        };
  return (
    <PublicShell locale={locale} active="blog">
      <main className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
        <div className="text-center">
          <p className="text-sm font-semibold text-blue-600">{copy.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">{copy.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">{copy.intro}</p>
        </div>
        <section className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-6"
            >
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{formatDate(post.date, locale)}</span>
                <span className="flex items-center gap-1">
                  <Clock3 className="size-3.5" />
                  {post.readTime} min
                </span>
              </div>
              <h2 className="mt-4 text-lg font-bold leading-7 text-slate-900">{post.title}</h2>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{post.excerpt}</p>
              <Link
                href={`/${locale}/blog/${post.slug}`}
                className="focus-ring mt-5 inline-flex items-center gap-2 self-start rounded-md text-sm font-semibold text-blue-700"
              >
                {copy.read} <ArrowRight className="size-4" />
              </Link>
            </article>
          ))}
        </section>
      </main>
    </PublicShell>
  );
}
