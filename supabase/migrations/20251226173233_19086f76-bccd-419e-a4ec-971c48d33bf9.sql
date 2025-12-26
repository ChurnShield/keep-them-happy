-- Create churn reason enum type
CREATE TYPE public.churn_reason AS ENUM (
  'card_expired',
  'insufficient_funds',
  'bank_decline',
  'no_retry_attempted',
  'unknown_failure'
);

-- Add churn_reason column to recovery_cases
ALTER TABLE public.recovery_cases
ADD COLUMN churn_reason public.churn_reason NOT NULL DEFAULT 'unknown_failure';