export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};

export type DocumentLine = {
  id: string | null;
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
};

export type Invoice = {
  id: string;
  draftReference: string | null;
  number: string | null;
  companyId: string | null;
  clientId: string | null;
  companyName: string;
  companyAddress: string | null;
  companyEmail: string;
  companyPhone: string | null;
  clientName: string;
  clientAddress: string | null;
  clientEmail: string;
  clientPhone: string | null;
  items: DocumentLine[];
  currency: string;
  subtotal: string;
  taxAmount: string;
  withholdingAmount: string;
  total: string;
  amountDue: string;
  taxRate: string;
  taxMode: 'none' | 'vat' | 'withholding';
  calculationVersion: 'legacy-v1' | 'v2';
  status: string;
  invoiceDate: string;
  dueDate: string | null;
  paymentMethod: string | null;
  notes: string | null;
  issuedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Quote = Omit<Invoice, 'invoiceDate' | 'dueDate'> & {
  quoteDate: string;
  validityDate: string;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  address: string | null;
  phone: string | null;
  companyName: string | null;
  fiscalRegion: 'NONE' | 'EU' | 'MG';
  siret: string | null;
  vatNumber: string | null;
  nif: string | null;
  stat: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Company = {
  id: string;
  name: string;
  address: string | null;
  email: string | null;
  phone: string | null;
  logoUrl: string | null;
  fiscalRegion: 'NONE' | 'EU' | 'MG';
  siret: string | null;
  vatNumber: string | null;
  nif: string | null;
  stat: string | null;
  iban: string | null;
  bic: string | null;
  defaultCurrency: string;
  defaultPaymentMethod: string;
  invoicePrefix: string;
  quotePrefix: string;
  isDefault: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};
