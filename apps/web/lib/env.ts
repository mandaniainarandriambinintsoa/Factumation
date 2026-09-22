type PublicEnvironment = {
  supabaseUrl: string;
  supabasePublishableKey: string;
  apiUrl: string;
  siteUrl: string;
};

export function getPublicEnvironment(): PublicEnvironment {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://factumation.manda-ia.com';
  if (!supabaseUrl || !supabasePublishableKey || !apiUrl) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and NEXT_PUBLIC_API_URL are required.',
    );
  }
  return {
    supabaseUrl,
    supabasePublishableKey,
    apiUrl: apiUrl.replace(/\/$/, ''),
    siteUrl: siteUrl.replace(/\/$/, ''),
  };
}

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://factumation.manda-ia.com').replace(/\/$/, '');
}
