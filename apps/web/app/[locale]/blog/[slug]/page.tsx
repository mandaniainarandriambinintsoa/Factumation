import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PublicShell } from '@/components/public-shell';
import { getPublishedPost } from '@/lib/blog';
import { formatDate } from '@/lib/format';
import { blogPosts } from '@/lib/blog-posts';

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ locale: post.lang, slug: post.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post =
    locale === 'fr' || locale === 'en' ? await getPublishedPost(locale, slug) : undefined;
  return post ? { title: post.title, description: post.excerpt, keywords: post.keywords } : {};
}
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (locale !== 'fr' && locale !== 'en') notFound();
  const post = await getPublishedPost(locale, slug);
  if (!post) notFound();
  const backLabel = locale === 'fr' ? 'Retour au blog' : 'Back to the blog';
  const readingLabel = locale === 'fr' ? 'min de lecture' : 'min read';
  return (
    <PublicShell locale={locale} active="blog">
      <main className="mx-auto max-w-3xl px-5 py-14">
        <Link href={`/${locale}/blog`} className="text-sm font-semibold text-blue-700">
          ← {backLabel}
        </Link>
        <article className="mt-8">
          <p className="text-sm text-slate-500">
            {formatDate(post.date, locale)} · {post.readTime} {readingLabel}
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">{post.excerpt}</p>
          <div className="mt-10 space-y-5">
            {post.content
              .split('\n')
              .filter(Boolean)
              .map((line, index) => {
                if (line.startsWith('### '))
                  return (
                    <h3 key={index} className="pt-3 text-xl font-bold text-slate-900">
                      {line.slice(4)}
                    </h3>
                  );
                if (line.startsWith('## '))
                  return (
                    <h2 key={index} className="pt-5 text-2xl font-bold text-slate-900">
                      {line.slice(3)}
                    </h2>
                  );
                if (line.startsWith('- '))
                  return (
                    <p
                      key={index}
                      className="pl-5 text-base leading-7 text-slate-700 before:mr-2 before:text-blue-600 before:content-['•']"
                    >
                      {line.slice(2).replace(/\*\*/g, '')}
                    </p>
                  );
                return (
                  <p key={index} className="text-base leading-7 text-slate-700">
                    {line.replace(/\*\*/g, '')}
                  </p>
                );
              })}
          </div>
        </article>
      </main>
    </PublicShell>
  );
}
