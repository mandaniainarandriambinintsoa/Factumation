
// URL du Webhook (à configurer ou remplacer par votre endpoint réel)
export const DEFAULT_WEBHOOK_URL = "https://n8n-godn.onrender.com/webhook/facture";

// URL du Webhook pour les devis
export const DEFAULT_QUOTE_WEBHOOK_URL = "https://n8n-godn.onrender.com/webhook/devis";

// URL du Webhook pour le formulaire de contact
export const DEFAULT_CONTACT_WEBHOOK_URL = "https://n8n-godn.onrender.com/webhook/contact";

export const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
];

export const PAYMENT_METHODS = [
  'Virement Bancaire',
  'Carte Bancaire',
  'Chèque',
  'PayPal',
  'Espèces',
  'mobile money'
];