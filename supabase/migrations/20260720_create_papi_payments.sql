-- Papi payment pilot: one-off Mobile Money/Card payments for Factumation plans.

ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_source_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_source_check
  CHECK (source IN ('stripe', 'manual', 'papi'));

CREATE TABLE IF NOT EXISTS papi_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('pro', 'business')),
  amount INTEGER NOT NULL CHECK (amount >= 300),
  currency TEXT NOT NULL DEFAULT 'MGA',
  provider TEXT,
  reference TEXT NOT NULL UNIQUE,
  payment_link TEXT,
  notification_token TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
  papi_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_papi_payments_user_id ON papi_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_papi_payments_reference ON papi_payments(reference);
CREATE INDEX IF NOT EXISTS idx_papi_payments_status ON papi_payments(status);

ALTER TABLE papi_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own papi payments"
  ON papi_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on papi payments"
  ON papi_payments FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE papi_payments IS
  'Payment links and webhook state for Papi Mobile Money/Card payment pilot.';
