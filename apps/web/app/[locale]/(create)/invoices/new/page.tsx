import { NewDocumentPage } from '@/components/new-document-page';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <NewDocumentPage locale={locale} kind="invoice" />;
}
