import type { DocumentCalculation } from '@factumation/domain';
import { formatMoney } from '@/lib/format';
import { paymentMethodLabel } from '@/lib/document-options';
import type { DocumentFormValues } from './document-form/document-form-schema';
import type { GuestIssuer } from './guest-document-parties-step';

// Inline, explicit RGB colors also make this document safe for html2canvas.
export function GuestDocumentPreview({
  invoice,
  issuer,
  values,
  calculation,
  locale,
}: {
  invoice: boolean;
  issuer: GuestIssuer;
  values: DocumentFormValues;
  calculation: DocumentCalculation | null;
  locale: string;
}) {
  const money = (amount: string) => formatMoney(amount, values.currency, locale);
  return (
    <article style={{ overflowWrap: 'anywhere', lineHeight: 1.6 }}>
      <h2 style={{ fontSize: 26, color: '#1e3a8a' }}>
        {invoice ? 'FACTURE' : 'DEVIS'} {issuer.number}
      </h2>
      <p>
        Date : {values.documentDate}
        <br />
        {invoice ? 'Échéance' : 'Valable jusqu’au'} : {values.secondDate}
      </p>
      <div style={{ display: 'flex', gap: 32, margin: '28px 0' }}>
        <div style={{ flex: 1, whiteSpace: 'pre-wrap' }}>
          <strong>Émetteur</strong>
          <br />
          {issuer.name}
          <br />
          {[issuer.address, issuer.email, issuer.phone, issuer.fiscalInfo]
            .filter(Boolean)
            .join('\n')}
        </div>
        <div style={{ flex: 1, whiteSpace: 'pre-wrap' }}>
          <strong>Destinataire</strong>
          <br />
          {values.clientName}
          <br />
          {[
            values.clientCompanyName,
            values.clientAddress,
            values.clientEmail,
            values.clientPhone,
            ...(values.clientFiscalRegion === 'EU'
              ? [
                  values.clientSiret && `SIRET : ${values.clientSiret}`,
                  values.clientVatNumber && `TVA : ${values.clientVatNumber}`,
                ]
              : []),
            ...(values.clientFiscalRegion === 'MG'
              ? [
                  values.clientNif && `NIF : ${values.clientNif}`,
                  values.clientStat && `STAT : ${values.clientStat}`,
                ]
              : []),
          ]
            .filter(Boolean)
            .join('\n')}
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {['Description', 'Quantité', 'Prix unitaire', 'Total'].map((title, index) => (
              <th
                key={title}
                style={{
                  width: index === 0 ? '43%' : '19%',
                  textAlign: index === 0 ? 'left' : 'right',
                  padding: 6,
                  borderBottom: '2px solid #cbd5e1',
                }}
              >
                {title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {values.items.map((item, index) => (
            <tr key={index} style={{ breakInside: 'avoid' }}>
              <td style={{ padding: 6, borderBottom: '1px solid #e2e8f0', whiteSpace: 'pre-wrap' }}>
                {item.description}
              </td>
              <td style={{ padding: 6, textAlign: 'right' }}>{item.quantity}</td>
              <td style={{ padding: 6, textAlign: 'right' }}>{money(item.unitPrice)}</td>
              <td style={{ padding: 6, textAlign: 'right' }}>
                {money(calculation?.items[index]?.total ?? '0')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ textAlign: 'right', marginTop: 24, breakInside: 'avoid' }}>
        <p>Sous-total : {money(calculation?.subtotal ?? '0')}</p>
        {values.taxMode === 'vat' ? (
          <p>
            TVA ({values.taxRate} %) : {money(calculation?.taxAmount ?? '0')}
          </p>
        ) : null}
        {values.taxMode === 'withholding' ? (
          <p>
            Retenue ({values.taxRate} %) : − {money(calculation?.withholdingAmount ?? '0')}
          </p>
        ) : null}
        <strong style={{ fontSize: 18 }}>
          Net à payer : {money(calculation?.amountDue ?? '0')}
        </strong>
      </div>
      <p>Mode de paiement : {paymentMethodLabel(values.paymentMethod)}</p>
      {values.notes ? <p style={{ whiteSpace: 'pre-wrap' }}>Notes : {values.notes}</p> : null}
    </article>
  );
}
