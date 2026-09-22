import { CompanyForm } from '@/components/company-form';

export default async function NewCompanyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <CompanyForm locale={locale} />;
}
