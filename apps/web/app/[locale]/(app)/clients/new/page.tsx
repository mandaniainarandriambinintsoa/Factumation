import { ClientForm } from '@/components/client-form';

export default async function NewClientPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <ClientForm locale={locale} />;
}
