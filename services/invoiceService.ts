import { InvoiceData } from '../types';

export interface InvoiceWithPdf extends InvoiceData {
  pdfBase64: string;
  pdfFileName: string;
}

export const sendInvoiceToWebhook = async (data: InvoiceData, webhookUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.warn(`Webhook HTTP status: ${response.status}. Continuing flow.`);
      return true;
    }

    return true;
  } catch (error) {
    console.warn('Webhook transfer failed (likely CORS or Network blocked). Continuing with PDF generation.', error);
    return true;
  }
};

export const sendInvoiceWithPdfToWebhook = async (
  data: InvoiceData,
  pdfBase64: string,
  webhookUrl: string
): Promise<boolean> => {
  try {
    const payload: InvoiceWithPdf = {
      ...data,
      pdfBase64,
      pdfFileName: `Facture-${data.invoiceNumber}.pdf`,
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn(`Webhook HTTP status: ${response.status}. Continuing flow.`);
      return true;
    }

    return true;
  } catch (error) {
    console.warn('Webhook transfer failed (likely CORS or Network blocked).', error);
    return true;
  }
};