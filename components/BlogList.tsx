import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
import SEOHead from './SEOHead';
import { getPublishedPosts, BlogPostRecord } from '../services/blogAdminService';
import { getBlogPostsByLang } from '../data/blogPosts';

const BlogList: React.FC = () => {
  const { t, locale } = useI18n();
  const { path } = useLocalizedPath();
  const [posts, setPosts] = useState<Array<{ slug: string; title: string; excerpt: string; keywords: string[]; date: string; readTime: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, [locale]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const supabasePosts = await getPublishedPosts(locale);
      if (supabasePosts.length > 0) {
        setPosts(supabasePosts.map((p) => ({
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          keywords: p.keywords,
          date: p.published_at || p.created_at,
          readTime: p.read_time,
        })));
      } else {
        // Fallback to static data
        const staticPosts = getBlogPostsByLang(locale);
        setPosts(staticPosts.map((p) => ({
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          keywords: p.keywords,
          date: p.date,
          readTime: p.readTime,
        })));
      }
    } catch {
      const staticPosts = getBlogPostsByLang(locale);
      setPosts(staticPosts.map((p) => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        keywords: p.keywords,
        date: p.date,
        readTime: p.readTime,
      })));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <SEOHead title={t('seo.blogTitle')} description={t('seo.blogDescription')} path="/blog" />

      {/* Hero */}
      <div className="bg-primary-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold sm:text-5xl mb-4">{t('blog.title')}</h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            {t('blog.subtitle')}
          </p>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 text-lg">{t('blog.noPosts')}</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-8">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {formatDate(post.date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} />
                      {post.readTime} {t('blog.readTime')}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold text-slate-900 mb-3">
                    <Link
                      to={path(`/blog/${post.slug}`)}
                      className="hover:text-primary-600 transition-colors"
                    >
                      {post.title}
                    </Link>
                  </h2>

                  <p className="text-slate-600 leading-relaxed mb-6">
                    {post.excerpt}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {post.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>

                  <Link
                    to={path(`/blog/${post.slug}`)}
                    className="inline-flex items-center text-primary-600 font-medium hover:text-primary-800 transition-colors"
                  >
                    {t('blog.readMore')}
                    <ArrowRight className="ml-1.5 w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogList;
