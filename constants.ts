
// URL du Webhook pour le formulaire de contact
export const DEFAULT_CONTACT_WEBHOOK_URL = "https://n8n-godn.onrender.com/webhook/contact";

export const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'MGA', symbol: 'Ar', name: 'Ariary Malgache' },
];

export const PAYMENT_METHODS = [
  { code: 'bank_transfer', labelKey: 'constants.bankTransfer' },
  { code: 'credit_card', labelKey: 'constants.creditCard' },
  { code: 'check', labelKey: 'constants.check' },
  { code: 'paypal', labelKey: 'constants.paypal' },
  { code: 'cash', labelKey: 'constants.cash' },
  { code: 'mobile_money', labelKey: 'constants.mobileMoney' },
];

// Régions fiscales avec leurs champs requis
export const FISCAL_REGIONS = [
  {
    code: 'NONE',
    nameKey: 'constants.fiscalNone',
    fields: []
  },
  {
    code: 'MG',
    nameKey: 'constants.fiscalMG',
    fields: [
      { key: 'nif', labelKey: 'constants.nif', placeholderKey: 'constants.nifPlaceholder' },
      { key: 'stat', labelKey: 'constants.stat', placeholderKey: 'constants.statPlaceholder' }
    ]
  },
  {
    code: 'EU',
    nameKey: 'constants.fiscalEU',
    fields: [
      { key: 'siret', labelKey: 'constants.siret', placeholderKey: 'constants.siretPlaceholder' },
      { key: 'tvaNumber', labelKey: 'constants.tvaNumber', placeholderKey: 'constants.tvaPlaceholder' }
    ]
  }
];