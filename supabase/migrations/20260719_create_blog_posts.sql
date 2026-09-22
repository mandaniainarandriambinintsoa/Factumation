-- Reconcile the blog schema that was originally created manually.
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  lang text NOT NULL DEFAULT 'fr' CHECK (lang IN ('fr', 'en')),
  title text NOT NULL,
  excerpt text NOT NULL,
  content text NOT NULL,
  keywords text[] DEFAULT '{}',
  author text NOT NULL DEFAULT 'Factumation',
  published boolean DEFAULT false,
  published_at timestamptz,
  read_time integer DEFAULT 5,
  image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published_lang
  ON public.blog_posts (published, lang);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts (slug);

CREATE OR REPLACE FUNCTION public.update_blog_posts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_blog_posts_updated_at();

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published posts" ON public.blog_posts;
CREATE POLICY "Public can read published posts"
  ON public.blog_posts FOR SELECT
  TO anon, authenticated
  USING (published = true);

DROP POLICY IF EXISTS "Admin full access" ON public.blog_posts;
CREATE POLICY "Admin full access"
  ON public.blog_posts FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'mandaniaina.randriambinintsoa@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'mandaniaina.randriambinintsoa@gmail.com');
