-- ================================================
-- ChurnShield Phase 1: Database Schema Migration
-- ================================================

-- Table for tracking processed Stripe events (idempotency)
CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_processed_stripe_events_event_id 
  ON public.processed_stripe_events(stripe_event_id);

-- Enable RLS
ALTER TABLE public.processed_stripe_events ENABLE ROW LEVEL SECURITY;

-- Only service role can manage (no public access needed)
CREATE POLICY "Service role can manage processed events"
  ON public.processed_stripe_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ================================================
-- stripe_accounts table
-- ================================================
CREATE TABLE IF NOT EXISTS public.stripe_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  stripe_account_id text,
  connected boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_accounts_user_id 
  ON public.stripe_accounts(user_id);

ALTER TABLE public.stripe_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stripe accounts"
  ON public.stripe_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage stripe accounts"
  ON public.stripe_accounts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ================================================
-- stripe_customers table
-- ================================================
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  stripe_customer_id text UNIQUE NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id 
  ON public.stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id 
  ON public.stripe_customers(stripe_customer_id);

ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stripe customer"
  ON public.stripe_customers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage stripe customers"
  ON public.stripe_customers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ================================================
-- stripe_subscriptions table (new table, separate from existing subscriptions)
-- ================================================
CREATE TABLE IF NOT EXISTS public.stripe_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_customer_id text,
  status text NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_user_id 
  ON public.stripe_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_stripe_id 
  ON public.stripe_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status 
  ON public.stripe_subscriptions(status);

ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON public.stripe_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON public.stripe_subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ================================================
-- stripe_invoices table
-- ================================================
CREATE TABLE IF NOT EXISTS public.stripe_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stripe_invoice_id text UNIQUE NOT NULL,
  stripe_subscription_id text,
  status text NOT NULL,
  amount_due bigint DEFAULT 0,
  amount_paid bigint DEFAULT 0,
  attempt_count integer DEFAULT 0,
  next_payment_attempt timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_invoices_user_id 
  ON public.stripe_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_stripe_id 
  ON public.stripe_invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_status 
  ON public.stripe_invoices(status);

ALTER TABLE public.stripe_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invoices"
  ON public.stripe_invoices
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage invoices"
  ON public.stripe_invoices
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ================================================
-- churn_risk_events table
-- ================================================
CREATE TABLE IF NOT EXISTS public.churn_risk_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  severity integer NOT NULL CHECK (severity >= 1 AND severity <= 5),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  stripe_object_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_churn_risk_events_user_id 
  ON public.churn_risk_events(user_id);
CREATE INDEX IF NOT EXISTS idx_churn_risk_events_user_occurred 
  ON public.churn_risk_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_churn_risk_events_event_type 
  ON public.churn_risk_events(event_type);

ALTER TABLE public.churn_risk_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own churn events"
  ON public.churn_risk_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage churn events"
  ON public.churn_risk_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ================================================
-- churn_risk_snapshot table
-- ================================================
CREATE TABLE IF NOT EXISTS public.churn_risk_snapshot (
  user_id uuid PRIMARY KEY,
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  top_reasons jsonb DEFAULT '[]',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.churn_risk_snapshot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own risk snapshot"
  ON public.churn_risk_snapshot
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage risk snapshots"
  ON public.churn_risk_snapshot
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ================================================
-- Triggers for updated_at timestamps
-- ================================================
CREATE OR REPLACE TRIGGER update_stripe_accounts_updated_at
  BEFORE UPDATE ON public.stripe_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_stripe_customers_updated_at
  BEFORE UPDATE ON public.stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_stripe_subscriptions_updated_at
  BEFORE UPDATE ON public.stripe_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_stripe_invoices_updated_at
  BEFORE UPDATE ON public.stripe_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();