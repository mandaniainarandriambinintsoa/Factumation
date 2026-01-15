import { QuoteData } from '../types';

export interface QuoteWithPdf extends QuoteData {
  pdfBase64: string;
  pdfFileName: string;
}

export const sendQuoteWithPdfToWebhook = async (
  data: QuoteData,
  pdfBase64: string,
  webhookUrl: string
): Promise<boolean> => {
  try {
    const payload: QuoteWithPdf = {
      ...data,
      pdfBase64,
      pdfFileName: `Devis-${data.quoteNumber}.pdf`,
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
