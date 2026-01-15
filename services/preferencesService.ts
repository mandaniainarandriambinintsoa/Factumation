import { supabase } from '../lib/supabase';
import { Tables, TablesUpdate } from '../lib/database.types';
import { FiscalInfo } from '../types';

export type UserPreferencesRow = Tables<'user_preferences'>;
export type UserPreferencesUpdate = TablesUpdate<'user_preferences'>;

// Mapped preferences type for frontend use
export interface MappedUserPreferences {
  id: string;
  userId: string;
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  logoUrl?: string;
  defaultCurrency: string;
  defaultPaymentMethod: string;
  invoicePrefix: string;
  quotePrefix: string;
  fiscalInfo?: FiscalInfo;
  createdAt: string;
  updatedAt: string;
}

// Map database preferences to frontend type
const mapDbPreferences = (dbPrefs: UserPreferencesRow): MappedUserPreferences => ({
  id: dbPrefs.id,
  userId: dbPrefs.user_id,
  companyName: dbPrefs.company_name || undefined,
  companyAddress: dbPrefs.company_address || undefined,
  companyEmail: dbPrefs.company_email || undefined,
  companyPhone: dbPrefs.company_phone || undefined,
  logoUrl: dbPrefs.logo_url || undefined,
  defaultCurrency: dbPrefs.default_currency || 'EUR',
  defaultPaymentMethod: dbPrefs.default_payment_method || 'Virement Bancaire',
  invoicePrefix: dbPrefs.invoice_prefix || 'INV',
  quotePrefix: dbPrefs.quote_prefix || 'DEV',
  fiscalInfo: (dbPrefs as any).fiscal_info || undefined,
  createdAt: dbPrefs.created_at || new Date().toISOString(),
  updatedAt: dbPrefs.updated_at || new Date().toISOString(),
});

// Default preferences
const getDefaultPreferences = (userId: string): MappedUserPreferences => ({
  id: '',
  userId,
  defaultCurrency: 'EUR',
  defaultPaymentMethod: 'Virement Bancaire',
  invoicePrefix: 'INV',
  quotePrefix: 'DEV',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Get user preferences (creates default if not exists)
export const getUserPreferences = async (): Promise<{
  data: MappedUserPreferences | null;
  error: string | null;
}> => {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Utilisateur non connecté' };
  }

  // Try to get existing preferences
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    console.error('Error fetching preferences:', error);
    return { data: null, error: error.message };
  }

  if (data) {
    return {
      data: mapDbPreferences(data),
      error: null,
    };
  }

  // Create default preferences if not exists
  const { data: newData, error: insertError } = await supabase
    .from('user_preferences')
    .insert({ user_id: user.id })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating default preferences:', insertError);
    return { data: getDefaultPreferences(user.id), error: null };
  }

  return {
    data: mapDbPreferences(newData),
    error: null,
  };
};

// Update user preferences
export const updateUserPreferences = async (
  updates: Partial<{
    companyName: string;
    companyAddress: string;
    companyEmail: string;
    companyPhone: string;
    logoUrl: string;
    defaultCurrency: string;
    defaultPaymentMethod: string;
    invoicePrefix: string;
    quotePrefix: string;
    fiscalInfo: FiscalInfo;
  }>
): Promise<{ data: MappedUserPreferences | null; error: string | null }> => {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Utilisateur non connecté' };
  }

  // Map frontend field names to database field names
  const dbUpdates: Record<string, any> = {
    user_id: user.id,
  };
  if (updates.companyName !== undefined) dbUpdates.company_name = updates.companyName || null;
  if (updates.companyAddress !== undefined) dbUpdates.company_address = updates.companyAddress || null;
  if (updates.companyEmail !== undefined) dbUpdates.company_email = updates.companyEmail || null;
  if (updates.companyPhone !== undefined) dbUpdates.company_phone = updates.companyPhone || null;
  if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl || null;
  if (updates.defaultCurrency !== undefined) dbUpdates.default_currency = updates.defaultCurrency || 'EUR';
  if (updates.defaultPaymentMethod !== undefined) dbUpdates.default_payment_method = updates.defaultPaymentMethod || 'Virement Bancaire';
  if (updates.invoicePrefix !== undefined) dbUpdates.invoice_prefix = updates.invoicePrefix || 'INV';
  if (updates.quotePrefix !== undefined) dbUpdates.quote_prefix = updates.quotePrefix || 'DEV';
  if (updates.fiscalInfo !== undefined) dbUpdates.fiscal_info = updates.fiscalInfo || null;

  // Use upsert to create or update in one operation
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(dbUpdates, {
      onConflict: 'user_id',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving preferences:', error);
    return { data: null, error: error.message };
  }

  return {
    data: mapDbPreferences(data),
    error: null,
  };
};

// Save company info (convenience method)
export const saveCompanyInfo = async (companyInfo: {
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone?: string;
  logoUrl?: string;
}): Promise<{ data: MappedUserPreferences | null; error: string | null }> => {
  return updateUserPreferences(companyInfo);
};
