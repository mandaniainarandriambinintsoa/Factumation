import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

import fontkit from '@pdf-lib/fontkit';
import { degrees, PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

export type PdfLine = { description: string; quantity: string; unitPrice: string; total: string };
export type DocumentPrintModel = {
  kind: 'invoice' | 'quote';
  number: string | null;
  draftReference: string | null;
  status: string;
  companyName: string;
  companyAddress: string | null;
  companyEmail: string;
  companyPhone: string | null;
  clientName: string;
  clientAddress: string | null;
  clientEmail: string;
  clientPhone: string | null;
  documentDate: string;
  secondDate: string | null;
  currency: string;
  items: PdfLine[];
  subtotal: string;
  taxMode: string;
  taxRate: string;
  taxAmount: string;
  withholdingAmount: string;
  amountDue: string;
  paymentMethod: string | null;
  notes: string | null;
};

const require = createRequire(import.meta.url);
let fontsPromise: Promise<{ regular: Uint8Array; bold: Uint8Array }> | undefined;
function loadFonts() {
  fontsPromise ??= Promise.all([
    readFile(require.resolve('@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff')),
    readFile(require.resolve('@fontsource/noto-sans/files/noto-sans-latin-700-normal.woff')),
  ]).then(([regular, bold]) => ({ regular, bold }));
  return fontsPromise;
}

const navy = rgb(30 / 255, 58 / 255, 138 / 255);
const slate = rgb(51 / 255, 65 / 255, 85 / 255);
const muted = rgb(100 / 255, 116 / 255, 139 / 255);
const border = rgb(226 / 255, 232 / 255, 240 / 255);
const pale = rgb(248 / 255, 250 / 255, 252 / 255);

export async function renderDocumentPdf(model: DocumentPrintModel): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const source = await loadFonts();
  const regular = await pdf.embedFont(source.regular, { subset: true });
  const bold = await pdf.embedFont(source.bold, { subset: true });
  let page = pdf.addPage([595.28, 841.89]);
  let y = drawHeader(page, model, regular, bold);

  const ensureSpace = (height: number) => {
    if (y - height > 75) return;
    page = pdf.addPage([595.28, 841.89]);
    y = 790;
  };
  drawTableHeader(page, y, bold);
  y -= 25;
  for (const item of model.items) {
    ensureSpace(34);
    page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.6, color: border });
    drawText(page, truncate(item.description, 68), 46, y - 20, 9, regular, slate);
    drawRight(page, item.quantity, 376, y - 20, 9, regular, slate);
    drawRight(page, money(item.unitPrice, model.currency), 470, y - 20, 9, regular, slate);
    drawRight(page, money(item.total, model.currency), 549, y - 20, 9, bold, slate);
    y -= 34;
  }
  ensureSpace(160);
  page.drawLine({ start: { x: 325, y }, end: { x: 555, y }, thickness: 0.8, color: border });
  y -= 22;
  y = totalLine(page, y, 'Sous-total', money(model.subtotal, model.currency), regular);
  if (model.taxMode === 'vat')
    y = totalLine(
      page,
      y,
      `TVA (${model.taxRate} %)`,
      money(model.taxAmount, model.currency),
      regular,
    );
  if (model.taxMode === 'withholding')
    y = totalLine(
      page,
      y,
      `Retenue (${model.taxRate} %)`,
      `- ${money(model.withholdingAmount, model.currency)}`,
      regular,
    );
  page.drawLine({
    start: { x: 325, y: y + 7 },
    end: { x: 555, y: y + 7 },
    thickness: 1,
    color: navy,
  });
  drawText(page, 'Net à payer', 330, y - 10, 11, bold, navy);
  drawRight(page, money(model.amountDue, model.currency), 550, y - 10, 12, bold, navy);
  y -= 48;
  if (model.paymentMethod) {
    drawText(page, 'Mode de paiement', 40, y, 9, bold, slate);
    drawText(page, model.paymentMethod, 40, y - 16, 9, regular, muted);
    y -= 44;
  }
  if (model.notes) {
    ensureSpace(60);
    drawText(page, 'Notes', 40, y, 9, bold, slate);
    for (const line of wrap(model.notes, regular, 9, 500).slice(0, 5)) {
      y -= 15;
      drawText(page, line, 40, y, 9, regular, muted);
    }
  }
  for (const current of pdf.getPages()) {
    current.drawText(
      `Généré par Factumation · ${model.number ?? model.draftReference ?? 'Brouillon'}`,
      { x: 40, y: 34, size: 8, font: regular, color: muted },
    );
  }
  pdf.setTitle(
    `${model.kind === 'invoice' ? 'Facture' : 'Devis'} ${model.number ?? model.draftReference ?? ''}`,
  );
  pdf.setProducer('Factumation');
  return pdf.save();
}

function drawHeader(
  page: PDFPage,
  model: DocumentPrintModel,
  regular: PDFFont,
  bold: PDFFont,
): number {
  const label = model.kind === 'invoice' ? 'FACTURE' : 'DEVIS';
  page.drawRectangle({ x: 0, y: 742, width: 595.28, height: 100, color: navy });
  drawText(page, model.companyName, 40, 804, 17, bold, rgb(1, 1, 1));
  drawText(
    page,
    [model.companyAddress, model.companyEmail, model.companyPhone].filter(Boolean).join(' · '),
    40,
    782,
    8,
    regular,
    rgb(219 / 255, 234 / 255, 254 / 255),
  );
  drawRight(page, label, 555, 804, 18, bold, rgb(1, 1, 1));
  drawRight(
    page,
    model.number ?? model.draftReference ?? 'BROUILLON',
    555,
    782,
    9,
    regular,
    rgb(219 / 255, 234 / 255, 254 / 255),
  );
  if (model.status === 'draft')
    page.drawText('BROUILLON', {
      x: 205,
      y: 420,
      size: 42,
      font: bold,
      color: rgb(0.9, 0.93, 0.97),
      rotate: degrees(35),
    });
  drawText(page, 'Destinataire', 40, 708, 9, bold, muted);
  drawText(page, model.clientName, 40, 686, 12, bold, slate);
  drawText(
    page,
    [model.clientAddress, model.clientEmail, model.clientPhone].filter(Boolean).join(' · '),
    40,
    669,
    8,
    regular,
    muted,
  );
  drawText(page, 'Date', 410, 708, 8, bold, muted);
  drawRight(page, model.documentDate, 555, 708, 9, regular, slate);
  drawText(page, model.kind === 'invoice' ? 'Échéance' : 'Validité', 410, 688, 8, bold, muted);
  drawRight(page, model.secondDate ?? '—', 555, 688, 9, regular, slate);
  return 635;
}
function drawTableHeader(page: PDFPage, y: number, font: PDFFont) {
  page.drawRectangle({ x: 40, y: y - 24, width: 515, height: 24, color: pale });
  drawText(page, 'Description', 46, y - 16, 8, font, muted);
  drawRight(page, 'Qté', 376, y - 16, 8, font, muted);
  drawRight(page, 'Prix unitaire', 470, y - 16, 8, font, muted);
  drawRight(page, 'Total', 549, y - 16, 8, font, muted);
}
function totalLine(page: PDFPage, y: number, label: string, value: string, font: PDFFont) {
  drawText(page, label, 330, y, 9, font, muted);
  drawRight(page, value, 550, y, 9, font, slate);
  return y - 20;
}
function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  font: PDFFont,
  color = slate,
) {
  page.drawText(text, { x, y, size, font, color });
}
function drawRight(
  page: PDFPage,
  text: string,
  right: number,
  y: number,
  size: number,
  font: PDFFont,
  color = slate,
) {
  drawText(page, text, right - font.widthOfTextAtSize(text, size), y, size, font, color);
}
function truncate(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}
function money(value: string, currency: string) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount)
    : `${value} ${currency}`;
}
function wrap(value: string, font: PDFFont, size: number, width: number) {
  const result: string[] = [];
  let line = '';
  for (const word of value.replace(/\s+/g, ' ').trim().split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= width) line = next;
    else {
      if (line) result.push(line);
      line = word;
    }
  }
  if (line) result.push(line);
  return result;
}
