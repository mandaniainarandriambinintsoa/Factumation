export type Database = {
  public: {
    Tables: {
      clients: {
        Row: ClientRow;
        Insert: ClientInsert;
        Update: ClientUpdate;
        Relationships: [];
      };
      companies: {
        Row: CompanyRow;
        Insert: CompanyInsert;
        Update: CompanyUpdate;
        Relationships: [];
      };
      invoices: {
        Row: InvoiceRow;
        Insert: never;
        Update: InvoiceUpdate;
        Relationships: [];
      };
      quotes: {
        Row: QuoteRow;
        Insert: never;
        Update: QuoteUpdate;
        Relationships: [];
      };
      subscriptions: {
        Row: SubscriptionRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      set_default_company: {
        Args: { p_company_id: string };
        Returns: string;
      };
      create_invoice_draft: {
        Args: CreateInvoiceDraftArgs;
        Returns: string;
      };
      issue_invoice: {
        Args: { p_invoice_id: string };
        Returns: string;
      };
      create_quote_draft: {
        Args: CreateQuoteDraftArgs;
        Returns: string;
      };
      issue_quote: {
        Args: { p_quote_id: string };
        Returns: string;
      };
      transition_quote: {
        Args: { p_quote_id: string; p_target_status: 'accepted' | 'rejected' };
        Returns: string;
      };
      mark_invoice_sent: { Args: { p_invoice_id: string }; Returns: string };
      mark_invoice_paid: { Args: { p_invoice_id: string }; Returns: string };
      mark_quote_sent: { Args: { p_quote_id: string }; Returns: string };
      get_dashboard_summary: {
        Args: Record<never, never>;
        Returns: unknown;
      };
      create_api_credential: {
        Args: {
          p_name: string;
          p_allowed_company_ids: string[];
          p_prefix: string;
          p_secret_hash: string;
          p_scopes: string[];
          p_expires_at: string | null;
        };
        Returns: { client_id: string; key_id: string }[];
      };
      rotate_api_credential: {
        Args: {
          p_client_id: string;
          p_prefix: string;
          p_secret_hash: string;
          p_scopes: string[];
          p_expires_at: string | null;
        };
        Returns: string;
      };
      revoke_api_credential: { Args: { p_key_id: string }; Returns: string };
      list_api_credentials: {
        Args: Record<never, never>;
        Returns: ApiCredentialRow[];
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

export type ApiCredentialRow = {
  client_id: string;
  client_name: string;
  allowed_company_ids: string[];
  key_id: string;
  prefix: string;
  scopes: string[];
  expires_at: string | null;
  revoked_at: string | null;
  last_used_at: string | null;
  created_at: string;
};

export type ClientRow = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  address: string | null;
  phone: string | null;
  company_name: string | null;
  fiscal_region: string | null;
  siret: string | null;
  vat_number: string | null;
  nif: string | null;
  stat: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ClientInsert = Omit<ClientRow, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ClientUpdate = Partial<Omit<ClientInsert, 'user_id'>>;

export type CompanyRow = {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
  fiscal_region: string | null;
  siret: string | null;
  vat_number: string | null;
  nif: string | null;
  stat: string | null;
  iban: string | null;
  bic: string | null;
  default_currency: string | null;
  default_payment_method: string | null;
  invoice_prefix: string | null;
  quote_prefix: string | null;
  is_default: boolean | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CompanyInsert = Omit<CompanyRow, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CompanyUpdate = Partial<Omit<CompanyInsert, 'user_id' | 'is_default'>>;

export type SubscriptionRow = {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  source: string;
  current_period_start: string | null;
  current_period_end: string | null;
  manual_expires_at: string | null;
  cancel_at_period_end: boolean | null;
  created_at: string;
  updated_at: string;
};

export type InvoiceRow = {
  id: string;
  user_id: string;
  company_id: string | null;
  client_id: string | null;
  draft_reference: string | null;
  invoice_number: string | null;
  invoice_date: string;
  due_date: string | null;
  company_name: string;
  company_address: string | null;
  company_email: string;
  company_phone: string | null;
  logo_url: string | null;
  client_name: string;
  client_address: string | null;
  client_email: string;
  client_phone: string | null;
  items: unknown;
  subtotal: number | string | null;
  tax_mode: string | null;
  tax_rate: number | string;
  tax_amount: number | string | null;
  withholding_amount: number | string | null;
  total: number | string;
  amount_due: number | string | null;
  currency: string;
  payment_method: string | null;
  status: string | null;
  calculation_version: string | null;
  idempotency_key: string | null;
  request_fingerprint: string | null;
  issued_at: string | null;
  notes: string | null;
  pdf_base64: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type InvoiceUpdate = {
  invoice_date?: string;
  due_date?: string | null;
  items?: unknown;
  subtotal?: string;
  tax_mode?: string;
  tax_rate?: string;
  tax_amount?: string;
  withholding_amount?: string;
  total?: string;
  amount_due?: string;
  currency?: string;
  payment_method?: string | null;
  notes?: string | null;
};

export type InvoiceReadRow = Omit<
  InvoiceRow,
  'idempotency_key' | 'request_fingerprint' | 'pdf_base64'
>;

export type CreateInvoiceDraftArgs = {
  p_company_id: string;
  p_client_id: string | null;
  p_client: unknown | null;
  p_items: unknown;
  p_currency: string;
  p_invoice_date: string;
  p_due_date: string | null;
  p_tax_mode: string;
  p_tax_rate: string;
  p_subtotal: string;
  p_tax_amount: string;
  p_withholding_amount: string;
  p_total: string;
  p_amount_due: string;
  p_payment_method: string | null;
  p_notes: string | null;
  p_idempotency_key: string;
  p_request_fingerprint: string;
};

export type QuoteRow = {
  id: string;
  user_id: string;
  company_id: string | null;
  client_id: string | null;
  draft_reference: string | null;
  quote_number: string | null;
  quote_date: string;
  validity_date: string;
  company_name: string;
  company_address: string | null;
  company_email: string;
  company_phone: string | null;
  logo_url: string | null;
  client_name: string;
  client_address: string | null;
  client_email: string;
  client_phone: string | null;
  items: unknown;
  subtotal: number | string | null;
  tax_mode: string | null;
  tax_rate: number | string;
  tax_amount: number | string | null;
  withholding_amount: number | string | null;
  total: number | string;
  amount_due: number | string | null;
  currency: string;
  payment_method: string | null;
  status: string | null;
  calculation_version: string | null;
  idempotency_key: string | null;
  request_fingerprint: string | null;
  issued_at: string | null;
  notes: string | null;
  pdf_base64: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type QuoteUpdate = {
  quote_date?: string;
  validity_date?: string;
  items?: unknown;
  subtotal?: string;
  tax_mode?: string;
  tax_rate?: string;
  tax_amount?: string;
  withholding_amount?: string;
  total?: string;
  amount_due?: string;
  currency?: string;
  payment_method?: string | null;
  notes?: string | null;
};

export type QuoteReadRow = Omit<QuoteRow, 'idempotency_key' | 'request_fingerprint' | 'pdf_base64'>;

export type CreateQuoteDraftArgs = {
  p_company_id: string;
  p_client_id: string | null;
  p_client: unknown | null;
  p_items: unknown;
  p_currency: string;
  p_quote_date: string;
  p_validity_date: string;
  p_tax_mode: string;
  p_tax_rate: string;
  p_subtotal: string;
  p_tax_amount: string;
  p_withholding_amount: string;
  p_total: string;
  p_amount_due: string;
  p_payment_method: string | null;
  p_notes: string | null;
  p_idempotency_key: string;
  p_request_fingerprint: string;
};
