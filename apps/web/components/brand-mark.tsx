import { FileText } from 'lucide-react';
import Link from 'next/link';

export function BrandMark({ locale, compact = false }: { locale: string; compact?: boolean }) {
  return (
    <Link
      href={`/${locale}`}
      className="focus-ring flex items-center gap-2.5 rounded-md"
      aria-label="Factumation, accueil"
    >
      <span
        className={`${compact ? 'p-1.5' : 'p-2'} rounded-lg bg-[var(--primary-900)] text-white`}
      >
        <FileText size={compact ? 20 : 24} />
      </span>
      <span
        className={`${compact ? 'text-lg' : 'text-xl'} font-bold tracking-tight text-[var(--primary-900)]`}
      >
        Factumation
      </span>
    </Link>
  );
}
