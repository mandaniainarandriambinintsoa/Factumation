export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          address: string | null
          company_name: string | null
          created_at: string | null
          email: string
          fiscal_region: string | null
          id: string
          name: string
          nif: string | null
          notes: string | null
          phone: string | null
          siret: string | null
          stat: string | null
          updated_at: string | null
          user_id: string
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          created_at?: string | null
          email: string
          fiscal_region?: string | null
          id?: string
          name: string
          nif?: string | null
          notes?: string | null
          phone?: string | null
          siret?: string | null
          stat?: string | null
          updated_at?: string | null
          user_id: string
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          fiscal_region?: string | null
          id?: string
          name?: string
          nif?: string | null
          notes?: string | null
          phone?: string | null
          siret?: string | null
          stat?: string | null
          updated_at?: string | null
          user_id?: string
          vat_number?: string | null
        }
      }
      companies: {
        Row: {
          address: string | null
          bic: string | null
          created_at: string | null
          default_currency: string | null
          default_payment_method: string | null
          email: string | null
          fiscal_region: string | null
          iban: string | null
          id: string
          invoice_prefix: string | null
          is_default: boolean | null
          logo_url: string | null
          name: string
          nif: string | null
          notes: string | null
          phone: string | null
          quote_prefix: string | null
          siret: string | null
          stat: string | null
          updated_at: string | null
          user_id: string
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          bic?: string | null
          created_at?: string | null
          default_currency?: string | null
          default_payment_method?: string | null
          email?: string | null
          fiscal_region?: string | null
          iban?: string | null
          id?: string
          invoice_prefix?: string | null
          is_default?: boolean | null
          logo_url?: string | null
          name: string
          nif?: string | null
          notes?: string | null
          phone?: string | null
          quote_prefix?: string | null
          siret?: string | null
          stat?: string | null
          updated_at?: string | null
          user_id: string
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          bic?: string | null
          created_at?: string | null
          default_currency?: string | null
          default_payment_method?: string | null
          email?: string | null
          fiscal_region?: string | null
          iban?: string | null
          id?: string
          invoice_prefix?: string | null
          is_default?: boolean | null
          logo_url?: string | null
          name?: string
          nif?: string | null
          notes?: string | null
          phone?: string | null
          quote_prefix?: string | null
          siret?: string | null
          stat?: string | null
          updated_at?: string | null
          user_id?: string
          vat_number?: string | null
        }
      }
      invoices: {
        Row: {
          client_address: string | null
          client_email: string
          client_name: string
          client_phone: string | null
          company_address: string | null
          company_email: string
          company_name: string
          company_phone: string | null
          created_at: string | null
          currency: string
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          items: Json
          logo_url: string | null
          notes: string | null
          payment_method: string | null
          pdf_base64: string | null
          status: string | null
          total: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_address?: string | null
          client_email: string
          client_name: string
          client_phone?: string | null
          company_address?: string | null
          company_email: string
          company_name: string
          company_phone?: string | null
          created_at?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          items?: Json
          logo_url?: string | null
          notes?: string | null
          payment_method?: string | null
          pdf_base64?: string | null
          status?: string | null
          total?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_address?: string | null
          client_email?: string
          client_name?: string
          client_phone?: string | null
          company_address?: string | null
          company_email?: string
          company_name?: string
          company_phone?: string | null
          created_at?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          items?: Json
          logo_url?: string | null
          notes?: string | null
          payment_method?: string | null
          pdf_base64?: string | null
          status?: string | null
          total?: number
          updated_at?: string | null
          user_id?: string
        }
      }
      quotes: {
        Row: {
          client_address: string | null
          client_email: string
          client_name: string
          client_phone: string | null
          company_address: string | null
          company_email: string
          company_name: string
          company_phone: string | null
          created_at: string | null
          currency: string
          id: string
          items: Json
          logo_url: string | null
          notes: string | null
          payment_method: string | null
          pdf_base64: string | null
          quote_date: string
          quote_number: string
          status: string | null
          total: number
          updated_at: string | null
          user_id: string
          validity_date: string
        }
        Insert: {
          client_address?: string | null
          client_email: string
          client_name: string
          client_phone?: string | null
          company_address?: string | null
          company_email: string
          company_name: string
          company_phone?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          items?: Json
          logo_url?: string | null
          notes?: string | null
          payment_method?: string | null
          pdf_base64?: string | null
          quote_date: string
          quote_number: string
          status?: string | null
          total?: number
          updated_at?: string | null
          user_id: string
          validity_date: string
        }
        Update: {
          client_address?: string | null
          client_email?: string
          client_name?: string
          client_phone?: string | null
          company_address?: string | null
          company_email?: string
          company_name?: string
          company_phone?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          items?: Json
          logo_url?: string | null
          notes?: string | null
          payment_method?: string | null
          pdf_base64?: string | null
          quote_date?: string
          quote_number?: string
          status?: string | null
          total?: number
          updated_at?: string | null
          user_id?: string
          validity_date?: string
        }
      }
      user_preferences: {
        Row: {
          company_address: string | null
          company_email: string | null
          company_name: string | null
          company_phone: string | null
          created_at: string | null
          default_currency: string | null
          default_payment_method: string | null
          id: string
          invoice_prefix: string | null
          logo_url: string | null
          quote_prefix: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string | null
          default_currency?: string | null
          default_payment_method?: string | null
          id?: string
          invoice_prefix?: string | null
          logo_url?: string | null
          quote_prefix?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string | null
          default_currency?: string | null
          default_payment_method?: string | null
          id?: string
          invoice_prefix?: string | null
          logo_url?: string | null
          quote_prefix?: string | null
          updated_at?: string | null
          user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
