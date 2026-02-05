-- Convert churnshield_fee_per_month from generated column to regular column
-- This allows the edge functions to set the capped fee value after aggregate calculation

-- Step 1: Drop the generated column
ALTER TABLE public.saved_customers DROP COLUMN IF EXISTS churnshield_fee_per_month;

-- Step 2: Re-add as a regular nullable numeric column with default 0
ALTER TABLE public.saved_customers 
ADD COLUMN churnshield_fee_per_month numeric DEFAULT 0;

-- Step 3: Add a comment explaining the column purpose
COMMENT ON COLUMN public.saved_customers.churnshield_fee_per_month IS 
'ChurnShield fee for this save. Calculated as 20% of saved revenue, but capped so total monthly fees per client do not exceed £500.';