import { test, expect } from '/srv/dev/tools/browser/node_modules/@playwright/test/index.mjs';
import { readFile } from 'node:fs/promises';
import { startAccountFixture, authenticateFixture } from './account-fixture.mjs';

let fixture;
test.beforeAll(async () => {
  fixture = await startAccountFixture();
});
test.afterAll(async () => {
  await fixture.close();
});

test.beforeEach(async ({ context }) => {
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== '127.0.0.1') return route.abort();
    return route.continue();
  });
});

for (const [collection, label, viewport] of [
  ['invoices', 'la facture', { width: 1280, height: 900 }],
  ['quotes', 'le devis', { width: 390, height: 844 }],
]) {
  test(`guest ${collection}: validation, preview, edit, PDF, no account requests`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const accountRequests = [];
    page.on('request', (request) => {
      if (/\/api\/v1\/|\/rest\/v1\/|\/auth\/v1\//.test(request.url()))
        accountRequests.push(request.url());
    });
    const serverRequestStart = fixture.requests.length;
    await page.goto(`/fr/${collection}/new`);
    await expect(page.getByText('Mode invité — sans connexion')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Client existant' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Envoyer', exact: true })).toHaveCount(0);
    await expect(page.getByText('Préremplir avec l’assistant')).toHaveCount(0);
    await page.getByRole('button', { name: `Prévisualiser ${label}` }).click();
    await expect(page.getByText('Le numéro est requis.')).toBeVisible();
    await page.getByLabel(/^Nom de l’émetteur/).fill('Atelier Démo');
    await page.getByLabel('Numéro du document *').fill('TEST-001');
    await page.getByLabel(/^Nom \*/).fill('Client Démo');
    await page.getByLabel(/^E-mail \*/).fill('client@example.test');
    await page.getByLabel(/^Description/).fill('Conseil <script>alert(1)</script>');
    await page.getByLabel('Prix unitaire', { exact: true }).fill('100');
    await page.getByLabel('Quantité', { exact: true }).fill('2');
    await page.getByRole('combobox', { name: 'Taxe', exact: true }).selectOption('vat');
    await page.getByLabel('Taux (%)').fill('20');
    await page.getByRole('button', { name: `Prévisualiser ${label}` }).click();
    const preview = page.getByRole('region', { name: 'Aperçu du document' });
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('240,00');
    await expect(preview).toContainText('Conseil <script>alert(1)</script>');
    if (collection === 'quotes') await expect(preview).toContainText('Valable jusqu’au');
    await page.getByRole('button', { name: 'Modifier', exact: true }).click();
    await expect(page.getByLabel('Prix unitaire', { exact: true })).toHaveValue('100');
    await page.getByLabel('Prix unitaire', { exact: true }).fill('150');
    await page.getByRole('button', { name: `Prévisualiser ${label}` }).click();
    await expect(preview).toContainText('360,00');
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Télécharger le PDF' }).click();
    const download = await downloaded;
    expect(download.suggestedFilename()).toMatch(/^(Facture|Devis)-TEST-001.pdf$/);
    const pdf = await readFile(await download.path());
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(5000);
    expect(accountRequests).toEqual([]);
    expect(fixture.requests.slice(serverRequestStart)).toEqual([]);
    expect(
      await page.evaluate(
        () => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole('navigation', { name: 'Type de document', exact: true })
      .getByRole('link', { name: collection === 'invoices' ? 'Devis' : 'Facture', exact: true })
      .click();
    await expect(page.getByLabel(/^Nom de l’émetteur/)).toHaveValue('');
  });
}

test('account pages remain protected', async ({ page }) => {
  for (const path of [
    'companies',
    'clients',
    'dashboard',
    'invoices',
    'quotes',
    'settings',
    'invoices/00000000-0000-4000-8000-000000000001/edit',
  ]) {
    await page.goto(`/fr/${path}`);
    await expect(page).toHaveURL(/\/fr\/login$/);
  }
});

for (const [collection, label] of [
  ['invoices', 'la facture'],
  ['quotes', 'le devis'],
]) {
  test(`authenticated ${collection} preserves saved data and advanced actions`, async ({
    page,
    context,
  }) => {
    await authenticateFixture(context);
    await page.goto(`/fr/${collection}/new`);
    await expect(page.getByText('Mode invité — sans connexion')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Client existant', exact: true })).toBeVisible();
    await expect(page.getByText('Préremplir avec l’assistant')).toBeVisible();
    await page
      .locator('select[name="clientId"]')
      .selectOption('00000000-0000-4000-8000-000000000003');
    await page.getByLabel('Description', { exact: true }).fill('Prestation connectée');
    await page.getByRole('button', { name: `Prévisualiser ${label}` }).click();
    await expect(page.getByRole('heading', { name: 'Société fixture' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Client fixture' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Envoyer', exact: true })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Enregistrer et télécharger', exact: true }),
    ).toBeVisible();
  });
}
