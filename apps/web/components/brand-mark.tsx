import Link from 'next/link';

export function BrandMark({
  locale,
  compact = false,
  className = '',
}: {
  locale: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={`/${locale}`}
      className={`focus-ring inline-flex shrink-0 items-center rounded-md ${className}`}
      aria-label="Factumation, accueil"
    >
      <img
        src="/brand/factumation-logo.svg"
        alt="Factumation"
        width={1230}
        height={285}
        className={`${compact ? 'h-7 w-auto' : 'h-8 w-auto sm:h-9'} object-contain`}
      />
    </Link>
  );
}
