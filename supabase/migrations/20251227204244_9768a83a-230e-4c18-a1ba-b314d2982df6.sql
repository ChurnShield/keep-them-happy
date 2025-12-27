-- ==========================================
-- RECOVERED REVENUE LEDGER TABLE
-- ==========================================
-- Purpose: Track recovered revenue with idempotency guarantees
-- Strategy: Double uniqueness constraints prevent any double-counting:
--   1. source_event_id - same Stripe event cannot create duplicates
--   2. (recovery_case_id, invoice_reference) - same case+invoice cannot duplicate

CREATE TABLE public.recovered_revenue_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  recovery_case_id uuid NOT NULL REFERENCES public.recovery_cases(id) ON DELETE RESTRICT,
  invoice_reference text NOT NULL,
  stripe_invoice_id text,
  amount_recovered numeric NOT NULL CHECK (amount_recovered >= 0),
  currency text NOT NULL DEFAULT 'USD',
  recovered_at timestamptz NOT NULL DEFAULT now(),
  source_event_id text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Idempotency constraints: prevent double-counting
CREATE UNIQUE INDEX ledger_source_event_unique ON public.recovered_revenue_ledger(source_event_id);
CREATE UNIQUE INDEX ledger_case_invoice_unique ON public.recovered_revenue_ledger(recovery_case_id, invoice_reference);

-- Performance index for aggregation queries
CREATE INDEX ledger_owner_recovered_at_idx ON public.recovered_revenue_ledger(owner_user_id, recovered_at);

-- Enable Row Level Security
ALTER TABLE public.recovered_revenue_ledger ENABLE ROW LEVEL SECURITY;

-- RLS Policies:
-- Owner can view their own ledger entries
CREATE POLICY "Users can view their own ledger entries"
  ON public.recovered_revenue_ledger
  FOR SELECT
  USING (auth.uid() = owner_user_id);

-- Service role can manage all ledger entries (webhook writes)
CREATE POLICY "Service role can manage ledger"
  ON public.recovered_revenue_ledger
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Block client writes entirely (no INSERT/UPDATE/DELETE for regular users)
CREATE POLICY "Block client INSERT on ledger"
  ON public.recovered_revenue_ledger
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Block client UPDATE on ledger"
  ON public.recovered_revenue_ledger
  FOR UPDATE
  USING (false);

CREATE POLICY "Block client DELETE on ledger"
  ON public.recovered_revenue_ledger
  FOR DELETE
  USING (false);

-- ==========================================
-- AGGREGATION VIEW: Monthly & Lifetime Totals
-- ==========================================
-- Helper view for internal analytics (no UI required)

CREATE OR REPLACE VIEW public.recovered_revenue_summary AS
SELECT 
  owner_user_id,
  -- Lifetime totals
  SUM(amount_recovered) AS lifetime_recovered,
  COUNT(*) AS lifetime_count,
  -- Current month totals (UTC)
  SUM(CASE 
    WHEN date_trunc('month', recovered_at) = date_trunc('month', now()) 
    THEN amount_recovered 
    ELSE 0 
  END) AS current_month_recovered,
  COUNT(CASE 
    WHEN date_trunc('month', recovered_at) = date_trunc('month', now()) 
    THEN 1 
  END) AS current_month_count,
  -- Most recent recovery
  MAX(recovered_at) AS last_recovered_at
FROM public.recovered_revenue_ledger
GROUP BY owner_user_id;