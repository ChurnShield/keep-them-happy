-- Add columns for real Stripe IDs to cancel_sessions table
-- These store the actual Stripe sub_xxx and cus_xxx IDs for real Stripe operations

ALTER TABLE public.cancel_sessions
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Add indexes for better lookup performance
CREATE INDEX IF NOT EXISTS idx_cancel_sessions_stripe_subscription_id 
ON public.cancel_sessions(stripe_subscription_id) 
WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cancel_sessions_stripe_customer_id 
ON public.cancel_sessions(stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

-- Add a comment to clarify the purpose
COMMENT ON COLUMN public.cancel_sessions.stripe_subscription_id IS 'Real Stripe subscription ID (sub_xxx) for applying Stripe actions';
COMMENT ON COLUMN public.cancel_sessions.stripe_customer_id IS 'Real Stripe customer ID (cus_xxx) for lookup purposes';