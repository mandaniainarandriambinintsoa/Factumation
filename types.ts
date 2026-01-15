export interface LineItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

// Fiscal information type
export interface FiscalInfo {
  region: string; // 'NONE' | 'MG' | 'EU'
  nif?: string;        // Madagascar
  stat?: string;       // Madagascar
  siret?: string;      // Europe
  tvaNumber?: string;  // Europe (N° TVA Intracommunautaire)
}

export interface InvoiceData {
  // Company Info
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone?: string;
  logoUrl?: string;
  fiscalInfo?: FiscalInfo;

  // Client Info
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone?: string;

  // Invoice Details
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  currency: string;
  paymentMethod?: string;

  // Items
  items: LineItem[];
}

export interface QuoteData {
  // Company Info
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone?: string;
  logoUrl?: string;
  fiscalInfo?: FiscalInfo;

  // Client Info
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone?: string;

  // Quote Details
  quoteNumber: string;
  quoteDate: string;
  validityDate: string;
  currency: string;
  paymentMethod?: string;

  // Items
  items: LineItem[];
}

// Auth Types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Status types
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled';
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

// Saved Invoice/Quote for history
export interface SavedInvoice {
  id: string;
  userId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  companyName: string;
  companyAddress?: string;
  companyEmail: string;
  companyPhone?: string;
  logoUrl?: string;
  clientName: string;
  clientAddress?: string;
  clientEmail: string;
  clientPhone?: string;
  items: LineItem[];
  total: number;
  currency: string;
  paymentMethod?: string;
  status: InvoiceStatus;
  notes?: string;
  pdfBase64?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedQuote {
  id: string;
  userId: string;
  quoteNumber: string;
  quoteDate: string;
  validityDate: string;
  companyName: string;
  companyAddress?: string;
  companyEmail: string;
  companyPhone?: string;
  logoUrl?: string;
  clientName: string;
  clientAddress?: string;
  clientEmail: string;
  clientPhone?: string;
  items: LineItem[];
  total: number;
  currency: string;
  paymentMethod?: string;
  status: QuoteStatus;
  notes?: string;
  pdfBase64?: string;
  createdAt: string;
  updatedAt: string;
}

// Client type for saved clients
export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  address?: string;
  phone?: string;
  companyName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// User Preferences
export interface UserPreferences {
  id: string;
  userId: string;
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  logoUrl?: string;
  defaultCurrency: string;
  defaultPaymentMethod: string;
  fiscalInfo?: FiscalInfo;
}