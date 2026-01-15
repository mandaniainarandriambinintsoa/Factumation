# FactuPro

**La facturation simplifiée pour les professionnels.**

FactuPro est une application web moderne de création de factures et devis, conçue pour les freelances et PME. Elle permet de générer des documents professionnels en PDF et de les envoyer automatiquement par email grâce à l'intégration avec des webhooks (n8n).

## Fonctionnalités

- **Création de factures** : Interface intuitive pour créer des factures professionnelles
- **Création de devis** : Génération de devis avec date de validité
- **Génération PDF** : Export instantané en PDF via impression navigateur
- **Envoi automatique par email** : Intégration webhook pour l'envoi automatisé des documents
- **Multi-devises** : Support EUR, USD, GBP, CAD, CHF
- **Méthodes de paiement** : Virement, CB, Chèque, PayPal, Espèces, Mobile Money
- **Formulaire de contact** : Envoi des demandes via webhook

## Stack Technologique

| Technologie | Utilisation |
|-------------|-------------|
| **React 19** | Framework frontend |
| **TypeScript** | Typage statique |
| **Vite** | Build tool et dev server |
| **Tailwind CSS** | Styling (via CDN) |
| **React Router** | Navigation SPA |
| **html2pdf.js** | Génération PDF côté client |
| **Lucide React** | Icônes |
| **n8n** | Automatisation backend (webhooks) |
| **Airtable** | Base de données (via n8n) |

## Architecture du Projet

```
Factupro/
├── index.html              # Point d'entrée HTML
├── index.tsx               # Point d'entrée React
├── App.tsx                 # Composant principal avec routing
├── types.ts                # Définitions TypeScript (interfaces)
├── constants.ts            # Configuration (URLs webhook, devises, etc.)
├── vite.config.ts          # Configuration Vite
├── tsconfig.json           # Configuration TypeScript
├── package.json            # Dépendances et scripts
│
├── components/             # Composants React
│   ├── Navbar.tsx          # Barre de navigation
│   ├── Hero.tsx            # Page d'accueil
│   ├── InvoiceForm.tsx     # Formulaire de création de facture
│   ├── QuoteForm.tsx       # Formulaire de création de devis
│   ├── About.tsx           # Page À propos
│   ├── Contact.tsx         # Page et formulaire de contact
│   └── Footer.tsx          # Pied de page
│
└── services/               # Services API
    ├── invoiceService.ts   # Envoi des factures via webhook
    └── quoteService.ts     # Envoi des devis via webhook
```

## Description des Fichiers

### Fichiers Racine

| Fichier | Description |
|---------|-------------|
| `App.tsx` | Configuration du router et structure principale de l'app |
| `types.ts` | Interfaces TypeScript : `LineItem`, `InvoiceData`, `QuoteData` |
| `constants.ts` | URLs des webhooks, liste des devises et méthodes de paiement |

### Composants (`/components`)

| Composant | Description |
|-----------|-------------|
| `Navbar.tsx` | Navigation responsive avec liens vers toutes les pages |
| `Hero.tsx` | Landing page avec CTA pour créer facture/devis |
| `InvoiceForm.tsx` | Formulaire complet de facture avec prévisualisation et export PDF |
| `QuoteForm.tsx` | Formulaire de devis (similaire aux factures) |
| `About.tsx` | Présentation du projet et de la stack technique |
| `Contact.tsx` | Formulaire de contact avec envoi webhook |
| `Footer.tsx` | Pied de page avec liens et copyright |

### Services (`/services`)

| Service | Description |
|---------|-------------|
| `invoiceService.ts` | Fonction `sendInvoiceWithPdfToWebhook()` pour envoyer facture + PDF en base64 |
| `quoteService.ts` | Fonction `sendQuoteWithPdfToWebhook()` pour envoyer devis + PDF en base64 |

## Installation

```bash
# Cloner le repo
git clone https://github.com/mandaniainarandriambinintsoa/Factupro.git
cd Factupro

# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Build pour production
npm run build
```

## Configuration des Webhooks

Les URLs des webhooks sont configurées dans `constants.ts` :

```typescript
// Webhook pour les factures
export const DEFAULT_WEBHOOK_URL = "https://votre-instance-n8n.com/webhook/facture";

// Webhook pour les devis
export const DEFAULT_QUOTE_WEBHOOK_URL = "https://votre-instance-n8n.com/webhook/devis";

// Webhook pour le formulaire de contact
export const DEFAULT_CONTACT_WEBHOOK_URL = "https://votre-instance-n8n.com/webhook/contact";
```

### Format des données envoyées

**Facture/Devis :**
```json
{
  "companyName": "Ma Société",
  "companyAddress": "123 Rue Example",
  "companyEmail": "contact@societe.com",
  "clientName": "Client SA",
  "clientEmail": "client@email.com",
  "invoiceNumber": "INV-2025-001",
  "items": [
    { "name": "Service", "quantity": 1, "unitPrice": 100 }
  ],
  "pdfBase64": "JVBERi0xLj...",
  "pdfFileName": "Facture-INV-2025-001.pdf"
}
```

## Workflow n8n Recommandé

1. **Réception Webhook** : Recevoir les données JSON
2. **Décodage PDF** : Convertir le base64 en fichier
3. **Sauvegarde Airtable** : Archiver les données
4. **Envoi Email** : Envoyer le PDF en pièce jointe au client

## Scripts Disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Lance le serveur de développement |
| `npm run build` | Build pour la production |
| `npm run preview` | Prévisualise le build de production |

## Auteur

**Mandaniaina Randriambinintsoa**
- Email : mandaniaina.randriambinitsoa@gmail.com
- Localisation : Tananarive, Madagascar

## Développement

Ce projet a été initié avec **Google AI Studio** (Gemini) et est maintenu avec **Claude Code** (Anthropic).

## Licence

Ce projet est sous licence MIT.
