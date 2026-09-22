import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="px-5 py-16 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-blue-50 text-blue-600">
        <Icon className="size-6" />
      </span>
      <h2 className="mt-4 font-semibold text-slate-900">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{description}</p>
      {action ? (
        <Link
          href={action.href}
          className="focus-ring mt-5 inline-flex rounded-lg bg-[var(--primary-900)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-800)]"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
