-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  lang TEXT NOT NULL DEFAULT 'fr' CHECK (lang IN ('fr', 'en')),
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  author TEXT NOT NULL DEFAULT 'Factumation',
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  read_time INTEGER DEFAULT 5,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for public queries
CREATE INDEX idx_blog_posts_published_lang ON blog_posts (published, lang);
CREATE INDEX idx_blog_posts_slug ON blog_posts (slug);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

-- RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public: anyone can read published posts
CREATE POLICY "Public can read published posts"
  ON blog_posts FOR SELECT
  USING (published = true);

-- Admin: full access (identified by email)
CREATE POLICY "Admin full access"
  ON blog_posts FOR ALL
  USING (
    auth.jwt() ->> 'email' = 'mandaniaina.randriambinintsoa@gmail.com'
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = 'mandaniaina.randriambinintsoa@gmail.com'
  );
