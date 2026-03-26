/**
 * Service d'envoi d'emails via Edge Function Supabase + Resend
 *
 * La clé API Resend est stockée côté serveur dans les secrets Supabase.
 *
 * Configuration requise:
 * 1. Créer un compte sur https://resend.com (gratuit: 100 emails/jour)
 * 2. Générer une clé API: https://resend.com/api-keys
 * 3. Ajouter la clé comme secret Supabase: RESEND_API_KEY
 *    - Via CLI: supabase secrets set RESEND_API_KEY=re_xxxxx
 *    - Via Dashboard: Project Settings > Edge Functions > Secrets
 * 4. (Optionnel) Vérifier un domaine custom dans Resend pour l'expéditeur
 */

import { InvoiceData, QuoteData } from '../types';
import { supabase } from '../lib/supabase';

/**
 * Vérifie si le service email est configuré
 */
export const isEmailConfigured = (): boolean => {
  return !!supabase;
};

/**
 * Envoie un email via l'Edge Function Supabase (Resend)
 */
const sendEmailViaEdgeFunction = async (
  type: 'invoice' | 'quote',
  data: {
    companyName: string;
    companyEmail: string;
    companyPhone?: string;
    clientName: string;
    clientEmail: string;
    documentNumber: string;
    documentDate: string;
    dueDate?: string;
    validityDate?: string;
    currency: string;
    paymentMethod?: string;
    items: { id: string; name: string; quantity: number; unitPrice: number }[];
  },
  pdfBase64: string
): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) {
    return {
      success: false,
      error: 'Service email non configuré. Veuillez configurer Supabase.',
    };
  }

  try {
    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: { type, data, pdfBase64 },
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'envoi de l\'email',
      };
    }

    if (result?.error) {
      return {
        success: false,
        error: result.error,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur réseau',
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
  return sendEmailViaEdgeFunction(
    'invoice',
    {
      companyName: data.companyName,
      companyEmail: data.companyEmail,
      companyPhone: data.companyPhone,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      documentNumber: data.invoiceNumber,
      documentDate: data.invoiceDate,
      dueDate: data.dueDate,
      currency: data.currency,
      paymentMethod: data.paymentMethod,
      items: data.items,
    },
    pdfBase64
  );
};

/**
 * Envoie un devis par email avec PDF en pièce jointe
 */
export const sendQuoteEmail = async (
  data: QuoteData,
  pdfBase64: string
): Promise<{ success: boolean; error?: string }> => {
  return sendEmailViaEdgeFunction(
    'quote',
    {
      companyName: data.companyName,
      companyEmail: data.companyEmail,
      companyPhone: data.companyPhone,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      documentNumber: data.quoteNumber,
      documentDate: data.quoteDate,
      validityDate: data.validityDate,
      currency: data.currency,
      paymentMethod: data.paymentMethod,
      items: data.items,
    },
    pdfBase64
  );
};
