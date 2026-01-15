import { supabase } from '../lib/supabase';
import { Tables, TablesInsert, TablesUpdate } from '../lib/database.types';

export type Client = Tables<'clients'>;
export type ClientInsert = Omit<TablesInsert<'clients'>, 'user_id'>;
export type ClientUpdate = TablesUpdate<'clients'>;

// Mapped client type for frontend use
export interface MappedClient {
  id: string;
  userId: string;
  name: string;
  email: string;
  address?: string;
  phone?: string;
  companyName?: string;
  fiscalRegion?: string;
  siret?: string;
  vatNumber?: string;
  nif?: string;
  stat?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Map database client to frontend type
const mapDbClient = (dbClient: Client): MappedClient => ({
  id: dbClient.id,
  userId: dbClient.user_id,
  name: dbClient.name,
  email: dbClient.email,
  address: dbClient.address || undefined,
  phone: dbClient.phone || undefined,
  companyName: dbClient.company_name || undefined,
  fiscalRegion: dbClient.fiscal_region || undefined,
  siret: dbClient.siret || undefined,
  vatNumber: dbClient.vat_number || undefined,
  nif: dbClient.nif || undefined,
  stat: dbClient.stat || undefined,
  notes: dbClient.notes || undefined,
  createdAt: dbClient.created_at || new Date().toISOString(),
  updatedAt: dbClient.updated_at || new Date().toISOString(),
});

// Create a new client
export const createClient = async (
  clientData: ClientInsert
): Promise<{ data: MappedClient | null; error: string | null }> => {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Utilisateur non connecté' };
  }

  const { data, error } = await supabase
    .from('clients')
    .insert({
      ...clientData,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating client:', error);
    return { data: null, error: error.message };
  }

  return {
    data: mapDbClient(data),
    error: null,
  };
};

// Get all clients for current user
export const getClients = async (): Promise<{ data: MappedClient[]; error: string | null }> => {
  if (!supabase) {
    return { data: [], error: 'Supabase non configuré' };
  }

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching clients:', error);
    return { data: [], error: error.message };
  }

  return {
    data: data.map(mapDbClient),
    error: null,
  };
};

// Get a single client by ID
export const getClientById = async (
  id: string
): Promise<{ data: MappedClient | null; error: string | null }> => {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
  }

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching client:', error);
    return { data: null, error: error.message };
  }

  return {
    data: mapDbClient(data),
    error: null,
  };
};

// Update a client
export const updateClient = async (
  id: string,
  updates: ClientUpdate
): Promise<{ data: MappedClient | null; error: string | null }> => {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
  }

  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating client:', error);
    return { data: null, error: error.message };
  }

  return {
    data: mapDbClient(data),
    error: null,
  };
};

// Delete a client
export const deleteClient = async (id: string): Promise<{ error: string | null }> => {
  if (!supabase) {
    return { error: 'Supabase non configuré' };
  }

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting client:', error);
    return { error: error.message };
  }

  return { error: null };
};

// Search clients by name or email
export const searchClients = async (
  query: string
): Promise<{ data: MappedClient[]; error: string | null }> => {
  if (!supabase) {
    return { data: [], error: 'Supabase non configuré' };
  }

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .order('name', { ascending: true })
    .limit(10);

  if (error) {
    console.error('Error searching clients:', error);
    return { data: [], error: error.message };
  }

  return {
    data: data.map(mapDbClient),
    error: null,
  };
};
