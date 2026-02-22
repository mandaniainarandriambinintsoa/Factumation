import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
import SEOHead from './SEOHead';
import { getPublishedPostBySlug } from '../services/blogAdminService';
import { getBlogPostBySlug } from '../data/blogPosts';

// Simple markdown-like renderer for blog content
function renderContent(content: string): React.ReactNode {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (currentList.length > 0 && listType) {
      const Tag = listType;
      elements.push(
        <Tag key={`list-${elements.length}`} className={listType === 'ol' ? 'list-decimal pl-6 space-y-2 my-4 text-slate-700' : 'list-disc pl-6 space-y-2 my-4 text-slate-700'}>
          {currentList.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          ))}
        </Tag>
      );
      currentList = [];
      listType = null;
    }
  };

  const formatInline = (text: string): string => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${i}`} className="text-2xl font-bold text-slate-900 mt-10 mb-4">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${i}`} className="text-xl font-semibold text-slate-900 mt-8 mb-3">
          {line.slice(4)}
        </h3>
      );
    } else if (line.match(/^- /)) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      currentList.push(line.slice(2));
    } else if (line.match(/^\d+\. /)) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      currentList.push(line.replace(/^\d+\.\s*/, ''));
    } else if (line.trim() === '') {
      flushList();
    } else {
      flushList();
      elements.push(
        <p
          key={`p-${i}`}
          className="text-slate-700 leading-relaxed my-4"
          dangerouslySetInnerHTML={{ __html: formatInline(line) }}
        />
      );
    }
  }
  flushList();

  return <>{elements}</>;
}

interface PostData {
  slug: string;
  lang: string;
  title: string;
  excerpt: string;
  content: string;
  keywords: string[];
  author: string;
  date: string;
  readTime: number;
}

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, locale } = useI18n();
  const { path } = useLocalizedPath();

  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadPost(slug);
    }
  }, [slug]);

  const loadPost = async (postSlug: string) => {
    setLoading(true);
    try {
      const supabasePost = await getPublishedPostBySlug(postSlug);
      if (supabasePost) {
        setPost({
          slug: supabasePost.slug,
          lang: supabasePost.lang,
          title: supabasePost.title,
          excerpt: supabasePost.excerpt,
          content: supabasePost.content,
          keywords: supabasePost.keywords,
          author: supabasePost.author,
          date: supabasePost.published_at || supabasePost.created_at,
          readTime: supabasePost.read_time,
        });
      } else {
        // Fallback to static data
        const staticPost = getBlogPostBySlug(postSlug);
        if (staticPost) {
          setPost({
            slug: staticPost.slug,
            lang: staticPost.lang,
            title: staticPost.title,
            excerpt: staticPost.excerpt,
            content: staticPost.content,
            keywords: staticPost.keywords,
            author: staticPost.author,
            date: staticPost.date,
            readTime: staticPost.readTime,
          });
        } else {
          setPost(null);
        }
      }
    } catch {
      const staticPost = getBlogPostBySlug(postSlug);
      if (staticPost) {
        setPost({
          slug: staticPost.slug,
          lang: staticPost.lang,
          title: staticPost.title,
          excerpt: staticPost.excerpt,
          content: staticPost.content,
          keywords: staticPost.keywords,
          author: staticPost.author,
          date: staticPost.date,
          readTime: staticPost.readTime,
        });
      } else {
        setPost(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (post) window.scrollTo(0, 0);
  }, [post]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">404</h1>
        <p className="text-slate-600 mb-8">{t('blog.noPosts')}</p>
        <Link
          to={path('/blog')}
          className="inline-flex items-center text-primary-600 font-medium"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          {t('blog.backToBlog')}
        </Link>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Article Schema JSON-LD
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    author: { '@type': 'Organization', name: post.author },
    datePublished: post.date,
    publisher: {
      '@type': 'Organization',
      name: 'Factumation',
      url: 'https://factumation.vercel.app',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://factumation.vercel.app/${post.lang}/blog/${post.slug}`,
    },
    keywords: post.keywords.join(', '),
  };

  return (
    <div className="bg-white min-h-screen">
      <SEOHead
        title={`${post.title} - Factumation`}
        description={post.excerpt}
        path={`/blog/${post.slug}`}
      />

      {/* Inject Article Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {/* Article Header */}
      <div className="bg-primary-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Link
            to={path('/blog')}
            className="inline-flex items-center text-primary-200 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            {t('blog.backToBlog')}
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-primary-200 text-sm">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {t('blog.publishedOn')} {formatDate(post.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {post.readTime} {t('blog.readTime')}
            </span>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="prose-slate">
          {renderContent(post.content)}
        </article>

        {/* Keywords */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <div className="flex flex-wrap gap-2">
            {post.keywords.map((kw) => (
              <span
                key={kw}
                className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-primary-50 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-slate-900 mb-3">
            {t('blog.ctaTitle')}
          </h3>
          <p className="text-slate-600 mb-6 max-w-lg mx-auto">
            {t('blog.ctaSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to={path('/create')}
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-900 text-white rounded-full font-semibold hover:bg-primary-800 transition-colors"
            >
              {t('blog.createInvoiceNow')}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <Link
              to={path('/quote')}
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-400 transition-colors"
            >
              {t('blog.createQuoteNow')}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
