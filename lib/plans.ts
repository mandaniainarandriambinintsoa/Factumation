export interface PlanFeatures {
  invoicesPerMonth: number; // -1 = unlimited
  quotesPerMonth: number;
  companies: number;
  customLogo: boolean;
  emailSending: boolean;
  watermark: boolean;
  recurringInvoices: boolean;
}

export interface Plan {
  id: 'free' | 'pro' | 'business';
  price: number; // EUR/month
  features: PlanFeatures;
}

export const PLANS: Record<string, Plan> = {
  free: {
    id: 'free',
    price: 0,
    features: {
      invoicesPerMonth: 2,
      quotesPerMonth: 2,
      companies: 1,
      customLogo: false,
      emailSending: false,
      watermark: false,
      recurringInvoices: false,
    },
  },
  pro: {
    id: 'pro',
    price: 9.99,
    features: {
      invoicesPerMonth: -1,
      quotesPerMonth: -1,
      companies: 3,
      customLogo: true,
      emailSending: true,
      watermark: false,
      recurringInvoices: false,
    },
  },
  business: {
    id: 'business',
    price: 19.99,
    features: {
      invoicesPerMonth: -1,
      quotesPerMonth: -1,
      companies: 10,
      customLogo: true,
      emailSending: true,
      watermark: false,
      recurringInvoices: true,
    },
  },
};

export type PlanId = keyof typeof PLANS;

export function getPlan(planId: string): Plan {
  return PLANS[planId] || PLANS.free;
}
