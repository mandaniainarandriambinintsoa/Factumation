
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
  { code: 'MGA', symbol: 'Ar', name: 'Ariary Malgache' },
];

export const PAYMENT_METHODS = [
  'Virement Bancaire',
  'Carte Bancaire',
  'Chèque',
  'PayPal',
  'Espèces',
  'mobile money'
];

// Régions fiscales avec leurs champs requis
export const FISCAL_REGIONS = [
  {
    code: 'NONE',
    name: 'Aucune (Particulier)',
    fields: []
  },
  {
    code: 'MG',
    name: 'Madagascar',
    fields: [
      { key: 'nif', label: 'NIF', placeholder: 'Numéro d\'Identification Fiscale' },
      { key: 'stat', label: 'STAT', placeholder: 'Numéro Statistique' }
    ]
  },
  {
    code: 'EU',
    name: 'Europe (France)',
    fields: [
      { key: 'siret', label: 'SIRET', placeholder: '14 chiffres' },
      { key: 'tvaNumber', label: 'N° TVA Intracom.', placeholder: 'FR + 11 chiffres' }
    ]
  }
];