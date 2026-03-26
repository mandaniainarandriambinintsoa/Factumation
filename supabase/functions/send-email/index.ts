import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the user is authenticated
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { type, data, pdfBase64 } = await req.json();

    if (!type || !data || !pdfBase64) {
      return new Response(JSON.stringify({ error: 'Missing required fields: type, data, pdfBase64' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isInvoice = type === 'invoice';
    const docLabel = isInvoice ? 'Facture' : 'Devis';
    const docLabelEn = isInvoice ? 'Invoice' : 'Quote';
    const filename = `${docLabel}-${data.documentNumber}.pdf`;

    // Calculate total
    const total = data.items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0
    );
    const formattedTotal = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: data.currency || 'EUR',
    }).format(total);

    const subject = `${docLabel} ${data.documentNumber} - ${data.companyName}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #2563eb; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">${docLabel} ${data.documentNumber}</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Bonjour <strong>${data.clientName}</strong>,</p>
          <p>Veuillez trouver ci-joint ${isInvoice ? 'la facture' : 'le devis'} <strong>${data.documentNumber}</strong> d'un montant de <strong>${formattedTotal}</strong>.</p>

          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="background: #f3f4f6;">
              <td style="padding: 8px 12px; font-weight: 600;">Date</td>
              <td style="padding: 8px 12px;">${data.documentDate}</td>
            </tr>
            ${data.dueDate ? `<tr><td style="padding: 8px 12px; font-weight: 600;">Echéance</td><td style="padding: 8px 12px;">${data.dueDate}</td></tr>` : ''}
            ${data.validityDate ? `<tr><td style="padding: 8px 12px; font-weight: 600;">Validité</td><td style="padding: 8px 12px;">${data.validityDate}</td></tr>` : ''}
            <tr style="background: #f3f4f6;">
              <td style="padding: 8px 12px; font-weight: 600;">Montant total</td>
              <td style="padding: 8px 12px; font-weight: 700; color: #2563eb;">${formattedTotal}</td>
            </tr>
          </table>

          <p style="color: #6b7280; font-size: 14px;">Le document PDF est en pièce jointe de cet email.</p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            ${data.companyName}${data.companyPhone ? ` | ${data.companyPhone}` : ''} | ${data.companyEmail}<br/>
            Envoyé via <a href="https://factumation.vercel.app" style="color: #2563eb;">Factumation</a>
          </p>
        </div>
      </div>
    `;

    // Send via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${data.companyName} <onboarding@resend.dev>`,
        to: [data.clientEmail],
        reply_to: data.companyEmail,
        subject,
        html,
        attachments: [
          {
            filename,
            content: pdfBase64,
          },
        ],
      }),
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend error:', resendResult);
      return new Response(JSON.stringify({
        error: resendResult.message || 'Erreur lors de l\'envoi de l\'email',
      }), {
        status: resendResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      messageId: resendResult.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
