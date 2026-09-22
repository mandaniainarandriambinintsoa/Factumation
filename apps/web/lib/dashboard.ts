export type DashboardDocument = {
  id: string;
  number: string | null;
  draftReference: string | null;
  status: string;
  clientName: string;
  total: string;
  currency: string;
  invoiceDate?: string;
  quoteDate?: string;
  createdAt: string;
};

export type CurrencyAmount = {
  currency: string;
  amount: string;
  count: number;
};

export type DashboardSummary = {
  invoices: {
    total: number;
    draft: number;
    issued: number;
    sent: number;
    paid: number;
    cancelled: number;
  };
  quotes: {
    total: number;
    draft: number;
    issued: number;
    sent: number;
    accepted: number;
    rejected: number;
    expired: number;
  };
  clients: number;
  revenueByCurrency: CurrencyAmount[];
  pendingByCurrency: CurrencyAmount[];
};
