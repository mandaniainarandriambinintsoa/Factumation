import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

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
const ink = rgb(15 / 255, 23 / 255, 42 / 255);
const slate = rgb(71 / 255, 85 / 255, 105 / 255);
const muted = rgb(100 / 255, 116 / 255, 139 / 255);
const border = rgb(226 / 255, 232 / 255, 240 / 255);

export async function renderDocumentPdf(model: DocumentPrintModel): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const source = await loadFonts();
  const regular = await pdf.embedFont(source.regular, { subset: true });
  const bold = await pdf.embedFont(source.bold, { subset: true });
  let page = pdf.addPage([595.28, 841.89]);
  let y = drawHeader(page, model, regular, bold);

  const newPage = () => {
    page = pdf.addPage([595.28, 841.89]);
    y = 790;
    drawTableHeader(page, y, bold);
    y -= 28;
  };

  drawTableHeader(page, y, bold);
  y -= 28;
  for (const item of model.items) {
    const lines = wrap(item.description, regular, 9, 260);
    const rowHeight = Math.max(52, lines.length * 14 + 24);
    if (y - rowHeight < 155) newPage();
    for (const [index, line] of lines.entries()) {
      drawText(page, line, 42, y - 19 - index * 14, 9, index === 0 ? bold : regular, ink);
    }
    drawRight(page, item.quantity, 372, y - 19, 9, regular, slate);
    drawRight(page, money(item.unitPrice, model.currency), 472, y - 19, 9, regular, slate);
    drawRight(page, money(item.total, model.currency), 553, y - 19, 9, bold, ink);
    y -= rowHeight;
    page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.7, color: border });
  }

  if (y < 235) newPage();
  y -= 34;
  drawText(page, 'Informations de paiement', 40, y, 10, bold, ink);
  drawText(page, `Méthode : ${paymentLabel(model.paymentMethod)}`, 40, y - 19, 9, regular, slate);
  drawText(page, `Devise : ${model.currency}`, 40, y - 35, 9, regular, slate);
  if (model.kind === 'invoice' && model.secondDate) {
    drawText(page, `Échéance : ${formatDate(model.secondDate)}`, 40, y - 51, 9, regular, slate);
  }

  let totalsY = y;
  totalsY = totalLine(page, totalsY, 'Sous-total', money(model.subtotal, model.currency), regular);
  if (model.taxMode === 'vat') {
    totalsY = totalLine(
      page,
      totalsY,
      `TVA (${model.taxRate} %)`,
      money(model.taxAmount, model.currency),
      regular,
    );
  }
  if (model.taxMode === 'withholding') {
    totalsY = totalLine(
      page,
      totalsY,
      `Retenue (${model.taxRate} %)`,
      `- ${money(model.withholdingAmount, model.currency)}`,
      regular,
    );
  }
  page.drawLine({
    start: { x: 325, y: totalsY + 8 },
    end: { x: 555, y: totalsY + 8 },
    thickness: 0.8,
    color: border,
  });
  drawText(page, 'Total à payer', 325, totalsY - 13, 13, bold, navy);
  drawRight(page, money(model.amountDue, model.currency), 553, totalsY - 13, 13, bold, navy);

  y = Math.min(y - 82, totalsY - 54);
  if (model.notes) {
    drawText(page, 'Notes', 40, y, 10, bold, ink);
    for (const line of wrap(model.notes, regular, 9, 510).slice(0, 6)) {
      y -= 15;
      drawText(page, line, 40, y, 9, regular, slate);
    }
  }

  for (const current of pdf.getPages()) {
    current.drawText(
      `Généré par Factumation · ${model.number ?? model.draftReference ?? 'Brouillon'}`,
      { x: 40, y: 30, size: 7.5, font: regular, color: muted },
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
  drawText(page, model.companyName, 40, 770, 16, bold, ink);
  let leftY = 749;
  for (const line of contactLines(model.companyAddress, model.companyEmail, model.companyPhone)) {
    drawText(page, line, 40, leftY, 9, regular, muted);
    leftY -= 15;
  }
  drawRight(page, label, 474, 770, 23, regular, ink);
  drawRight(page, model.number ?? model.draftReference ?? 'BROUILLON', 553, 770, 13, bold, navy);
  drawRight(page, `Date : ${formatDate(model.documentDate)}`, 553, 747, 9, regular, slate);
  drawRight(page, model.clientName, 553, 704, 14, bold, ink);
  let rightY = 684;
  for (const line of contactLines(model.clientAddress, model.clientEmail, model.clientPhone)) {
    drawRight(page, line, 553, rightY, 9, regular, muted);
    rightY -= 15;
  }
  page.drawLine({
    start: { x: 40, y: 626 },
    end: { x: 555, y: 626 },
    thickness: 0.8,
    color: border,
  });
  return 596;
}

function drawTableHeader(page: PDFPage, y: number, font: PDFFont) {
  drawText(page, 'DESCRIPTION', 40, y - 16, 8, font, muted);
  drawRight(page, 'QUANTITÉ', 372, y - 16, 8, font, muted);
  drawRight(page, 'PRIX UNITAIRE', 472, y - 16, 8, font, muted);
  drawRight(page, 'TOTAL', 553, y - 16, 8, font, muted);
  page.drawLine({
    start: { x: 40, y: y - 25 },
    end: { x: 555, y: y - 25 },
    thickness: 0.7,
    color: border,
  });
}

function totalLine(page: PDFPage, y: number, label: string, value: string, font: PDFFont) {
  drawText(page, label, 325, y, 9, font, slate);
  drawRight(page, value, 553, y, 9, font, slate);
  return y - 22;
}

function contactLines(address: string | null, email: string, phone: string | null): string[] {
  return [...(address?.split(/\r?\n/).filter(Boolean) ?? []), email, ...(phone ? [phone] : [])];
}

function paymentLabel(value: string | null): string {
  const labels: Record<string, string> = {
    bank_transfer: 'Virement Bancaire',
    credit_card: 'Carte Bancaire',
    check: 'Chèque',
    paypal: 'PayPal',
    cash: 'Espèces',
    mobile_money: 'Mobile Money',
  };
  return value ? (labels[value] ?? value) : 'Non renseigné';
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC' }).format(date);
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
  return result.length ? result : [''];
}
