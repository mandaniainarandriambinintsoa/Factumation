import { supabase } from '../lib/supabase';
import { InvoiceData, QuoteData, SavedInvoice, SavedQuote, LineItem } from '../types';
import { Tables } from '../lib/database.types';

// Database row types
type DbInvoice = Tables<'invoices'>;
type DbQuote = Tables<'quotes'>;

// Status types
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled';
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

// Helper to calculate total
const calculateTotal = (items: LineItem[]): number => {
  return items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
};

// Save invoice to history
export const saveInvoice = async (
  invoiceData: InvoiceData,
  pdfBase64?: string,
  status: InvoiceStatus = 'draft'
): Promise<{ data: SavedInvoice | null; error: string | null }> => {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Utilisateur non connecté' };
  }

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      user_id: user.id,
      invoice_number: invoiceData.invoiceNumber,
      invoice_date: invoiceData.invoiceDate,
      due_date: invoiceData.dueDate || null,
      company_name: invoiceData.companyName,
      company_address: invoiceData.companyAddress,
      company_email: invoiceData.companyEmail,
      company_phone: invoiceData.companyPhone || null,
      logo_url: invoiceData.logoUrl || null,
      client_name: invoiceData.clientName,
      client_address: invoiceData.clientAddress,
      client_email: invoiceData.clientEmail,
      client_phone: invoiceData.clientPhone || null,
      items: invoiceData.items,
      total: calculateTotal(invoiceData.items),
      currency: invoiceData.currency,
      payment_method: invoiceData.paymentMethod || null,
      pdf_base64: pdfBase64 || null,
      status,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving invoice:', error);
    return { data: null, error: error.message };
  }

  return {
    data: mapDbInvoice(data),
    error: null
  };
};

// Save quote to history
export const saveQuote = async (
  quoteData: QuoteData,
  pdfBase64?: string,
  status: QuoteStatus = 'draft'
): Promise<{ data: SavedQuote | null; error: string | null }> => {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Utilisateur non connecté' };
  }

  const { data, error } = await supabase
    .from('quotes')
    .insert({
      user_id: user.id,
      quote_number: quoteData.quoteNumber,
      quote_date: quoteData.quoteDate,
      validity_date: quoteData.validityDate,
      company_name: quoteData.companyName,
      company_address: quoteData.companyAddress,
      company_email: quoteData.companyEmail,
      company_phone: quoteData.companyPhone || null,
      logo_url: quoteData.logoUrl || null,
      client_name: quoteData.clientName,
      client_address: quoteData.clientAddress,
      client_email: quoteData.clientEmail,
      client_phone: quoteData.clientPhone || null,
      items: quoteData.items,
      total: calculateTotal(quoteData.items),
      currency: quoteData.currency,
      payment_method: quoteData.paymentMethod || null,
      pdf_base64: pdfBase64 || null,
      status,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving quote:', error);
    return { data: null, error: error.message };
  }

  return {
    data: mapDbQuote(data),
    error: null
  };
};

// Get all invoices for current user
export const getInvoices = async (): Promise<{ data: SavedInvoice[]; error: string | null }> => {
  if (!supabase) {
    return { data: [], error: 'Supabase non configuré' };
  }

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching invoices:', error);
    return { data: [], error: error.message };
  }

  return {
    data: data.map(mapDbInvoice),
    error: null
  };
};

// Get all quotes for current user
export const getQuotes = async (): Promise<{ data: SavedQuote[]; error: string | null }> => {
  if (!supabase) {
    return { data: [], error: 'Supabase non configuré' };
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching quotes:', error);
    return { data: [], error: error.message };
  }

  return {
    data: data.map(mapDbQuote),
    error: null
  };
};

// Delete invoice
export const deleteInvoice = async (id: string): Promise<{ error: string | null }> => {
  if (!supabase) {
    return { error: 'Supabase non configuré' };
  }

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting invoice:', error);
    return { error: error.message };
  }

  return { error: null };
};

// Delete quote
export const deleteQuote = async (id: string): Promise<{ error: string | null }> => {
  if (!supabase) {
    return { error: 'Supabase non configuré' };
  }

  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting quote:', error);
    return { error: error.message };
  }

  return { error: null };
};

// Update invoice status
export const updateInvoiceStatus = async (
  id: string,
  status: InvoiceStatus
): Promise<{ data: SavedInvoice | null; error: string | null }> => {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
  }

  const { data, error } = await supabase
    .from('invoices')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating invoice status:', error);
    return { data: null, error: error.message };
  }

  return {
    data: mapDbInvoice(data),
    error: null,
  };
};

// Update quote status
export const updateQuoteStatus = async (
  id: string,
  status: QuoteStatus
): Promise<{ data: SavedQuote | null; error: string | null }> => {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
  }

  const { data, error } = await supabase
    .from('quotes')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating quote status:', error);
    return { data: null, error: error.message };
  }

  return {
    data: mapDbQuote(data),
    error: null,
  };
};

// Get single invoice by ID
export const getInvoiceById = async (
  id: string
): Promise<{ data: SavedInvoice | null; error: string | null }> => {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
  }

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching invoice:', error);
    return { data: null, error: error.message };
  }

  return {
    data: mapDbInvoice(data),
    error: null,
  };
};

// Get single quote by ID
export const getQuoteById = async (
  id: string
): Promise<{ data: SavedQuote | null; error: string | null }> => {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching quote:', error);
    return { data: null, error: error.message };
  }

  return {
    data: mapDbQuote(data),
    error: null,
  };
};

// Map database invoice to frontend type
const mapDbInvoice = (dbInvoice: DbInvoice): SavedInvoice => ({
  id: dbInvoice.id,
  userId: dbInvoice.user_id,
  invoiceNumber: dbInvoice.invoice_number,
  invoiceDate: dbInvoice.invoice_date,
  dueDate: dbInvoice.due_date || undefined,
  companyName: dbInvoice.company_name,
  companyAddress: dbInvoice.company_address || undefined,
  companyEmail: dbInvoice.company_email,
  companyPhone: dbInvoice.company_phone || undefined,
  logoUrl: dbInvoice.logo_url || undefined,
  clientName: dbInvoice.client_name,
  clientAddress: dbInvoice.client_address || undefined,
  clientEmail: dbInvoice.client_email,
  clientPhone: dbInvoice.client_phone || undefined,
  items: dbInvoice.items as unknown as LineItem[],
  total: dbInvoice.total,
  currency: dbInvoice.currency,
  paymentMethod: dbInvoice.payment_method || undefined,
  status: (dbInvoice.status as InvoiceStatus) || 'draft',
  notes: dbInvoice.notes || undefined,
  pdfBase64: dbInvoice.pdf_base64 || undefined,
  createdAt: dbInvoice.created_at || new Date().toISOString(),
  updatedAt: dbInvoice.updated_at || new Date().toISOString(),
});

// Map database quote to frontend type
const mapDbQuote = (dbQuote: DbQuote): SavedQuote => ({
  id: dbQuote.id,
  userId: dbQuote.user_id,
  quoteNumber: dbQuote.quote_number,
  quoteDate: dbQuote.quote_date,
  validityDate: dbQuote.validity_date,
  companyName: dbQuote.company_name,
  companyAddress: dbQuote.company_address || undefined,
  companyEmail: dbQuote.company_email,
  companyPhone: dbQuote.company_phone || undefined,
  logoUrl: dbQuote.logo_url || undefined,
  clientName: dbQuote.client_name,
  clientAddress: dbQuote.client_address || undefined,
  clientEmail: dbQuote.client_email,
  clientPhone: dbQuote.client_phone || undefined,
  items: dbQuote.items as unknown as LineItem[],
  total: dbQuote.total,
  currency: dbQuote.currency,
  paymentMethod: dbQuote.payment_method || undefined,
  status: (dbQuote.status as QuoteStatus) || 'draft',
  notes: dbQuote.notes || undefined,
  pdfBase64: dbQuote.pdf_base64 || undefined,
  createdAt: dbQuote.created_at || new Date().toISOString(),
  updatedAt: dbQuote.updated_at || new Date().toISOString(),
});
