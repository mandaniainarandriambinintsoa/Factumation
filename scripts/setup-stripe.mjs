/**
 * One-time script to create Stripe products and prices for Factumation.
 * Uses native fetch (Node 18+) — no npm dependency needed.
 *
 * Usage: STRIPE_SECRET_KEY=sk_test_... node scripts/setup-stripe.mjs
 *
 * After running, copy the output price IDs to your Supabase secrets.
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY must be set before running this script.');
}

async function stripePost(endpoint, data) {
  const response = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(data).toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Stripe API error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

const plans = [
  {
    key: 'PRO',
    name: 'Factumation Pro',
    description: 'Factures et devis illimités, logo personnalisé, envoi email, sans watermark',
    priceInCents: 999,
  },
  {
    key: 'BUSINESS',
    name: 'Factumation Business',
    description: 'Tout Pro + 10 sociétés, factures récurrentes',
    priceInCents: 1999,
  },
];

async function main() {
  console.log('Creating Stripe products for Factumation (test mode)...');

  const results = {};
  for (const plan of plans) {
    const product = await stripePost('products', {
      name: plan.name,
      description: plan.description,
    });
    console.log(`Product created: ${product.name} (${product.id})`);

    const price = await stripePost('prices', {
      product: product.id,
      currency: 'eur',
      unit_amount: plan.priceInCents.toString(),
      'recurring[interval]': 'month',
    });
    console.log(`Price: ${plan.priceInCents / 100} EUR/month (${price.id})`);
    results[plan.key] = price.id;
  }

  console.log('\n=== PRICE IDS ===');
  console.log(`STRIPE_PRICE_PRO=${results.PRO}`);
  console.log(`STRIPE_PRICE_BUSINESS=${results.BUSINESS}`);
  console.log('\nStore the Stripe secret and price IDs with Supabase secrets.');
  console.log('Set VITE_STRIPE_PUBLIC_KEY separately from the Stripe Dashboard.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
