import { supabase } from '../lib/supabase';

export interface BlogPostRecord {
  id: string;
  slug: string;
  lang: 'fr' | 'en';
  title: string;
  excerpt: string;
  content: string;
  keywords: string[];
  author: string;
  published: boolean;
  published_at: string | null;
  read_time: number;
  image: string | null;
  created_at: string;
  updated_at: string;
}

export type BlogPostInput = Omit<BlogPostRecord, 'id' | 'created_at' | 'updated_at'>;

// --- Public (read published) ---

export async function getPublishedPosts(lang: 'fr' | 'en'): Promise<BlogPostRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .eq('lang', lang)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching published posts:', error);
    return [];
  }
  return data || [];
}

export async function getPublishedPostBySlug(slug: string): Promise<BlogPostRecord | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error) return null;
  return data;
}

// --- Admin CRUD ---

export async function getAllBlogPosts(): Promise<BlogPostRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching all blog posts:', error);
    return [];
  }
  return data || [];
}

export async function getBlogPostById(id: string): Promise<BlogPostRecord | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function createBlogPost(post: BlogPostInput): Promise<BlogPostRecord | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      ...post,
      published_at: post.published ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating blog post:', error);
    return null;
  }
  return data;
}

export async function updateBlogPost(id: string, post: Partial<BlogPostInput>): Promise<BlogPostRecord | null> {
  if (!supabase) return null;

  const updateData: any = { ...post };
  // Set published_at when publishing for the first time
  if (post.published) {
    const existing = await getBlogPostById(id);
    if (existing && !existing.published_at) {
      updateData.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating blog post:', error);
    return null;
  }
  return data;
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting blog post:', error);
    return false;
  }
  return true;
}
