import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: { href: string; label: string; icon: LucideIcon };
}) {
  return (
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        {eyebrow ? (
          <p className="text-sm font-semibold text-[var(--primary-600)]">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">{description}</p>
      </div>
      {action ? (
        <Link
          href={action.href}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary-900)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-800)]"
        >
          <action.icon className="size-4" />
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
