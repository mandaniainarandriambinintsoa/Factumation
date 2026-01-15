import { supabase } from '../lib/supabase';
import { Tables, TablesInsert, TablesUpdate } from '../lib/database.types';

export type Company = Tables<'companies'>;
export type CompanyInsert = Omit<TablesInsert<'companies'>, 'user_id'>;
export type CompanyUpdate = TablesUpdate<'companies'>;

// Mapped company type for frontend use
export interface MappedCompany {
  id: string;
  userId: string;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  logoUrl?: string;
  fiscalRegion: string;
  siret?: string;
  vatNumber?: string;
  nif?: string;
  stat?: string;
  iban?: string;
  bic?: string;
  defaultCurrency: string;
  defaultPaymentMethod: string;
  invoicePrefix: string;
  quotePrefix: string;
  isDefault: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Map database company to frontend type
const mapDbCompany = (dbCompany: Company): MappedCompany => ({
  id: dbCompany.id,
  userId: dbCompany.user_id,
  name: dbCompany.name,
  address: dbCompany.address || undefined,
  email: dbCompany.email || undefined,
  phone: dbCompany.phone || undefined,
  logoUrl: dbCompany.logo_url || undefined,
  fiscalRegion: dbCompany.fiscal_region || 'NONE',
  siret: dbCompany.siret || undefined,
  vatNumber: dbCompany.vat_number || undefined,
  nif: dbCompany.nif || undefined,
  stat: dbCompany.stat || undefined,
  iban: dbCompany.iban || undefined,
  bic: dbCompany.bic || undefined,
  defaultCurrency: dbCompany.default_currency || 'EUR',
  defaultPaymentMethod: dbCompany.default_payment_method || 'Virement Bancaire',
  invoicePrefix: dbCompany.invoice_prefix || 'INV',
  quotePrefix: dbCompany.quote_prefix || 'DEV',
  isDefault: dbCompany.is_default || false,
  notes: dbCompany.notes || undefined,
  createdAt: dbCompany.created_at || new Date().toISOString(),
  updatedAt: dbCompany.updated_at || new Date().toISOString(),
});

// Create a new company
export const createCompany = async (
  companyData: {
    name: string;
    address?: string | null;
    email?: string | null;
    phone?: string | null;
    logoUrl?: string | null;
    fiscalRegion?: string | null;
    siret?: string | null;
    vatNumber?: string | null;
    nif?: string | null;
    stat?: string | null;
    iban?: string | null;
    bic?: string | null;
    defaultCurrency?: string | null;
    defaultPaymentMethod?: string | null;
    invoicePrefix?: string | null;
    quotePrefix?: string | null;
    isDefault?: boolean | null;
    notes?: string | null;
  }
): Promise<{ data: MappedCompany | null; error: string | null }> => {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Utilisateur non connecté' };
  }

  const { data, error } = await supabase
    .from('companies')
    .insert({
      name: companyData.name,
      address: companyData.address,
      email: companyData.email,
      phone: companyData.phone,
      logo_url: companyData.logoUrl,
      fiscal_region: companyData.fiscalRegion || 'NONE',
      siret: companyData.siret,
      vat_number: companyData.vatNumber,
      nif: companyData.nif,
      stat: companyData.stat,
      iban: companyData.iban,
      bic: companyData.bic,
      default_currency: companyData.defaultCurrency || 'EUR',
      default_payment_method: companyData.defaultPaymentMethod || 'Virement Bancaire',
      invoice_prefix: companyData.invoicePrefix || 'INV',
      quote_prefix: companyData.quotePrefix || 'DEV',
      is_default: companyData.isDefault || false,
      notes: companyData.notes,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating company:', error);
    return { data: null, error: error.message };
  }

  return {
    data: mapDbCompany(data),
    error: null,
  };
};

// Get all companies for current user
export const getCompanies = async (): Promise<{ data: MappedCompany[]; error: string | null }> => {
  if (!supabase) {
    return { data: [], error: 'Supabase non configuré' };
  }

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching companies:', error);
    return { data: [], error: error.message };
  }

  return {
    data: data.map(mapDbCompany),
    error: null,
  };
};

// Get default company for current user
export const getDefaultCompany = async (): Promise<{ data: MappedCompany | null; error: string | null }> => {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
  }

  // First try to get the default company
  const { data: defaultData, error: defaultError } = await supabase
    .from('companies')
    .select('*')
    .eq('is_default', true)
    .single();

  if (!defaultError && defaultData) {
    return {
      data: mapDbCompany(defaultData),
      error: null,
    };
  }

  // If no default, get the first company
  const { data: firstData, error: firstError } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (firstError) {
    if (firstError.code === 'PGRST116') {
      // No companies found
      return { data: null, error: null };
    }
    console.error('Error fetching default company:', firstError);
    return { data: null, error: firstError.message };
  }

  return {
    data: mapDbCompany(firstData),
    error: null,
  };
};

// Get a single company by ID
export const getCompanyById = async (
  id: string
): Promise<{ data: MappedCompany | null; error: string | null }> => {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
  }

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching company:', error);
    return { data: null, error: error.message };
  }

  return {
    data: mapDbCompany(data),
    error: null,
  };
};

// Update a company
export const updateCompany = async (
  id: string,
  updates: {
    name?: string;
    address?: string | null;
    email?: string | null;
    phone?: string | null;
    logoUrl?: string | null;
    fiscalRegion?: string | null;
    siret?: string | null;
    vatNumber?: string | null;
    nif?: string | null;
    stat?: string | null;
    iban?: string | null;
    bic?: string | null;
    defaultCurrency?: string | null;
    defaultPaymentMethod?: string | null;
    invoicePrefix?: string | null;
    quotePrefix?: string | null;
    isDefault?: boolean | null;
    notes?: string | null;
  }
): Promise<{ data: MappedCompany | null; error: string | null }> => {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
  }

  // Map frontend field names to database field names
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.address !== undefined) dbUpdates.address = updates.address;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl;
  if (updates.fiscalRegion !== undefined) dbUpdates.fiscal_region = updates.fiscalRegion;
  if (updates.siret !== undefined) dbUpdates.siret = updates.siret;
  if (updates.vatNumber !== undefined) dbUpdates.vat_number = updates.vatNumber;
  if (updates.nif !== undefined) dbUpdates.nif = updates.nif;
  if (updates.stat !== undefined) dbUpdates.stat = updates.stat;
  if (updates.iban !== undefined) dbUpdates.iban = updates.iban;
  if (updates.bic !== undefined) dbUpdates.bic = updates.bic;
  if (updates.defaultCurrency !== undefined) dbUpdates.default_currency = updates.defaultCurrency;
  if (updates.defaultPaymentMethod !== undefined) dbUpdates.default_payment_method = updates.defaultPaymentMethod;
  if (updates.invoicePrefix !== undefined) dbUpdates.invoice_prefix = updates.invoicePrefix;
  if (updates.quotePrefix !== undefined) dbUpdates.quote_prefix = updates.quotePrefix;
  if (updates.isDefault !== undefined) dbUpdates.is_default = updates.isDefault;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

  const { data, error } = await supabase
    .from('companies')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating company:', error);
    return { data: null, error: error.message };
  }

  return {
    data: mapDbCompany(data),
    error: null,
  };
};

// Delete a company
export const deleteCompany = async (id: string): Promise<{ error: string | null }> => {
  if (!supabase) {
    return { error: 'Supabase non configuré' };
  }

  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting company:', error);
    return { error: error.message };
  }

  return { error: null };
};

// Set a company as default
export const setDefaultCompany = async (id: string): Promise<{ data: MappedCompany | null; error: string | null }> => {
  return updateCompany(id, { isDefault: true });
};
