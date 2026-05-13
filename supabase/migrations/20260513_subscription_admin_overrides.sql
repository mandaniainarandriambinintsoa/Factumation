-- Admin overrides on subscriptions: allow manual plan/status set outside Stripe
-- (direct payment by bank transfer, complimentary access, etc.)

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'stripe'
    CHECK (source IN ('stripe', 'manual')),
  ADD COLUMN IF NOT EXISTS manual_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Quick lookup of manually-managed subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_source ON subscriptions(source)
  WHERE source = 'manual';

COMMENT ON COLUMN subscriptions.source IS
  'Origin of the subscription state. ''stripe'' = managed by Stripe webhooks. ''manual'' = set by an admin; Stripe webhooks must NOT overwrite.';
COMMENT ON COLUMN subscriptions.manual_expires_at IS
  'Expiry date when source=''manual''. Ignored when source=''stripe'' (use current_period_end).';
COMMENT ON COLUMN subscriptions.admin_notes IS
  'Internal admin notes (e.g. ''paid by bank transfer 2026-05-12, ref XYZ''). Never exposed to end users.';
