import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function Pagination({
  page,
  limit,
  total,
  path,
  query = {},
}: {
  page: number;
  limit: number;
  total: number;
  path: string;
  query?: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  const href = (target: number) => {
    const params = new URLSearchParams({ page: String(target) });
    for (const [key, value] of Object.entries(query)) if (value) params.set(key, value);
    return `${path}?${params.toString()}`;
  };
  const common =
    'focus-ring inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50';
  return (
    <nav className="mt-5 flex items-center justify-between" aria-label="Pagination">
      <span className="text-sm text-slate-500">
        Page {page} sur {pages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className={common}>
            <ChevronLeft className="size-4" /> Précédent
          </Link>
        ) : null}
        {page < pages ? (
          <Link href={href(page + 1)} className={common}>
            Suivant <ChevronRight className="size-4" />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
