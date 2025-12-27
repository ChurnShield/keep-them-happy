-- Fix SECURITY DEFINER view warning
-- Drop and recreate view with SECURITY INVOKER (default, explicit for clarity)
DROP VIEW IF EXISTS public.recovered_revenue_summary;

CREATE VIEW public.recovered_revenue_summary 
WITH (security_invoker = true) AS
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