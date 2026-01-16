-- Fix churnshield_fee_per_month calculation
-- Currently: 20% of new_mrr (WRONG)
-- Correct: 20% of saved revenue (original_mrr - new_mrr), capped at $500

-- First drop the existing generated column
ALTER TABLE public.saved_customers DROP COLUMN churnshield_fee_per_month;

-- Add it back with the correct formula
ALTER TABLE public.saved_customers 
ADD COLUMN churnshield_fee_per_month numeric GENERATED ALWAYS AS (LEAST((original_mrr - new_mrr) * 0.20, 500)) STORED;