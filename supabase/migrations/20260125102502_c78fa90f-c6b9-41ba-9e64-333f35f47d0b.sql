-- Fix RLS policies for customers table
-- The issue: All policies are RESTRICTIVE, which means they AND together
-- When there are no PERMISSIVE policies, the default is to deny access
-- But the scanner is flagging that the table may be publicly accessible

-- Drop and recreate the user-facing SELECT policies as PERMISSIVE (default)
-- to properly restrict access to authenticated users only

-- customers table: Recreate user SELECT policy as PERMISSIVE
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
CREATE POLICY "Users can view their own customers" 
ON public.customers 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Drop and recreate admin SELECT policy as PERMISSIVE
DROP POLICY IF EXISTS "Admins can view all customers" ON public.customers;
CREATE POLICY "Admins can view all customers" 
ON public.customers 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- churn_risk_snapshot table: Recreate user SELECT policy as PERMISSIVE
DROP POLICY IF EXISTS "Users can view their own risk snapshot" ON public.churn_risk_snapshot;
CREATE POLICY "Users can view their own risk snapshot" 
ON public.churn_risk_snapshot 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- stripe_customers table: Recreate user SELECT policy as PERMISSIVE
DROP POLICY IF EXISTS "Users can view their own stripe customer" ON public.stripe_customers;
CREATE POLICY "Users can view their own stripe customer" 
ON public.stripe_customers 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);