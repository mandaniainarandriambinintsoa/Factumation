export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author: string
          content: string
          created_at: string | null
          excerpt: string
          id: string
          image: string | null
          keywords: string[] | null
          lang: string
          published: boolean | null
          published_at: string | null
          read_time: number | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author?: string
          content: string
          created_at?: string | null
          excerpt: string
          id?: string
          image?: string | null
          keywords?: string[] | null
          lang?: string
          published?: boolean | null
          published_at?: string | null
          read_time?: number | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string
          content?: string
          created_at?: string | null
          excerpt?: string
          id?: string
          image?: string | null
          keywords?: string[] | null
          lang?: string
          published?: boolean | null
          published_at?: string | null
          read_time?: number | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
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
        Relationships: []
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
        Relationships: []
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
          tax_rate: number
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
          tax_rate?: number
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
          tax_rate?: number
          total?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          tax_rate: number
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
          tax_rate?: number
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
          tax_rate?: number
          total?: number
          updated_at?: string | null
          user_id?: string
          validity_date?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          fiscal_info: Json | null
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
          fiscal_info?: Json | null
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
          fiscal_info?: Json | null
          id?: string
          invoice_prefix?: string | null
          logo_url?: string | null
          quote_prefix?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
