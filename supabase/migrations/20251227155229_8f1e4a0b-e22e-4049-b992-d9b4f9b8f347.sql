-- Add unique index on invoice_reference to prevent duplicate recovery cases
-- This provides database-level idempotency for recovery case creation
CREATE UNIQUE INDEX IF NOT EXISTS idx_recovery_cases_invoice_reference_unique 
ON public.recovery_cases (invoice_reference) 
WHERE invoice_reference IS NOT NULL;