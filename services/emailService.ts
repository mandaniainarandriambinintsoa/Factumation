/**
 * Service d'envoi d'emails via Brevo (ex-Sendinblue)
 * Plan gratuit: 300 emails/jour, 9000 emails/mois
 *
 * Configuration requise:
 * 1. Créer un compte sur https://www.brevo.com (gratuit, sans carte bancaire)
 * 2. Générer une clé API: https://app.brevo.com/settings/keys/api
 * 3. Ajouter VITE_BREVO_API_KEY dans votre fichier .env
 */

import { InvoiceData, QuoteData } from '../types';
import { CURRENCIES } from '../constants';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

interface EmailAttachment {
  content: string; // Base64 encoded
  name: string;
}

interface BrevoEmailPayload {
  sender: { email: string; name: string };
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  attachment?: EmailAttachment[];
}

/**
 * Vérifie si Brevo est configuré
 */
export const isBrevoConfigured = (): boolean => {
  const apiKey = import.meta.env.VITE_BREVO_API_KEY;
  return !!apiKey && apiKey !== 'your-brevo-api-key-here';
};

/**
 * Récupère le symbole de la devise
 */
const getCurrencySymbol = (currencyCode: string): string => {
  return CURRENCIES.find(c => c.code === currencyCode)?.symbol || currencyCode;
};

/**
 * Génère le template HTML pour une facture
 */
const generateInvoiceEmailHtml = (data: InvoiceData, total: number): string => {
  const currencySymbol = getCurrencySymbol(data.currency);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
        .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
        .amount { font-size: 28px; font-weight: bold; color: #1e3a8a; }
        .btn { display: inline-block; background: #1e3a8a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin-top: 20px; }
        .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #3b82f6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Nouvelle Facture</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">N° ${data.invoiceNumber}</p>
        </div>
        <div class="content">
          <p>Bonjour <strong>${data.clientName}</strong>,</p>
          <p>Veuillez trouver ci-joint votre facture de la part de <strong>${data.companyName}</strong>.</p>

          <div class="info-box">
            <p style="margin: 0;"><strong>Montant total:</strong></p>
            <p class="amount" style="margin: 5px 0;">${total.toFixed(2)} ${currencySymbol}</p>
          </div>

          <div class="info-box">
            <p style="margin: 0 0 10px 0;"><strong>Détails:</strong></p>
            <p style="margin: 5px 0;">Date d'émission: ${new Date(data.invoiceDate).toLocaleDateString('fr-FR')}</p>
            ${data.dueDate ? `<p style="margin: 5px 0;">Date d'échéance: ${new Date(data.dueDate).toLocaleDateString('fr-FR')}</p>` : ''}
            <p style="margin: 5px 0;">Mode de paiement: ${data.paymentMethod}</p>
          </div>

          <p>Le document PDF est joint à cet email.</p>
          <p>Merci pour votre confiance.</p>
          <p>Cordialement,<br><strong>${data.companyName}</strong></p>
        </div>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement via FactuPro</p>
          <p>${data.companyEmail} | ${data.companyPhone || ''}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Génère le template HTML pour un devis
 */
const generateQuoteEmailHtml = (data: QuoteData, total: number): string => {
  const currencySymbol = getCurrencySymbol(data.currency);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
        .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
        .amount { font-size: 28px; font-weight: bold; color: #1e3a8a; }
        .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #3b82f6; }
        .validity { background: #fef3c7; border-left-color: #f59e0b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Nouveau Devis</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">N° ${data.quoteNumber}</p>
        </div>
        <div class="content">
          <p>Bonjour <strong>${data.clientName}</strong>,</p>
          <p>Veuillez trouver ci-joint votre devis de la part de <strong>${data.companyName}</strong>.</p>

          <div class="info-box">
            <p style="margin: 0;"><strong>Montant total:</strong></p>
            <p class="amount" style="margin: 5px 0;">${total.toFixed(2)} ${currencySymbol}</p>
          </div>

          <div class="info-box validity">
            <p style="margin: 0;"><strong>Validité du devis:</strong></p>
            <p style="margin: 5px 0;">Ce devis est valable jusqu'au <strong>${new Date(data.validityDate).toLocaleDateString('fr-FR')}</strong></p>
          </div>

          <div class="info-box">
            <p style="margin: 0 0 10px 0;"><strong>Détails:</strong></p>
            <p style="margin: 5px 0;">Date d'émission: ${new Date(data.quoteDate).toLocaleDateString('fr-FR')}</p>
            <p style="margin: 5px 0;">Mode de paiement proposé: ${data.paymentMethod}</p>
          </div>

          <p>Le document PDF est joint à cet email.</p>
          <p>N'hésitez pas à nous contacter pour toute question.</p>
          <p>Cordialement,<br><strong>${data.companyName}</strong></p>
        </div>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement via FactuPro</p>
          <p>${data.companyEmail} | ${data.companyPhone || ''}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Envoie un email via l'API Brevo
 */
const sendEmailViaBrevo = async (payload: BrevoEmailPayload): Promise<{ success: boolean; error?: string }> => {
  const apiKey = import.meta.env.VITE_BREVO_API_KEY;

  if (!apiKey || apiKey === 'your-brevo-api-key-here') {
    return {
      success: false,
      error: 'Brevo API key non configurée. Ajoutez VITE_BREVO_API_KEY dans votre fichier .env'
    };
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Brevo API error:', errorData);
      return {
        success: false,
        error: errorData.message || `Erreur HTTP ${response.status}`
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l\'envoi via Brevo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur réseau'
    };
  }
};

/**
 * Envoie une facture par email avec PDF en pièce jointe
 */
export const sendInvoiceEmail = async (
  data: InvoiceData,
  pdfBase64: string
): Promise<{ success: boolean; error?: string }> => {
  const total = data.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  const payload: BrevoEmailPayload = {
    sender: {
      email: data.companyEmail,
      name: data.companyName
    },
    to: [{
      email: data.clientEmail,
      name: data.clientName
    }],
    subject: `Facture ${data.invoiceNumber} - ${data.companyName}`,
    htmlContent: generateInvoiceEmailHtml(data, total),
    attachment: [{
      content: pdfBase64,
      name: `Facture-${data.invoiceNumber}.pdf`
    }]
  };

  return sendEmailViaBrevo(payload);
};

/**
 * Envoie un devis par email avec PDF en pièce jointe
 */
export const sendQuoteEmail = async (
  data: QuoteData,
  pdfBase64: string
): Promise<{ success: boolean; error?: string }> => {
  const total = data.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  const payload: BrevoEmailPayload = {
    sender: {
      email: data.companyEmail,
      name: data.companyName
    },
    to: [{
      email: data.clientEmail,
      name: data.clientName
    }],
    subject: `Devis ${data.quoteNumber} - ${data.companyName}`,
    htmlContent: generateQuoteEmailHtml(data, total),
    attachment: [{
      content: pdfBase64,
      name: `Devis-${data.quoteNumber}.pdf`
    }]
  };

  return sendEmailViaBrevo(payload);
};
