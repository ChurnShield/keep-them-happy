-- Add explicit RESTRICTIVE policy to block non-admin SELECT on payment_recovery
-- This provides defense-in-depth alongside the existing admin policy
CREATE POLICY "Block non-admin SELECT on payment_recovery"
ON public.payment_recovery
AS RESTRICTIVE
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add explicit RESTRICTIVE policy for stripe_connections to ensure only service role can access
-- Drop the blocking policies and replace with more explicit service-role-only pattern
DROP POLICY IF EXISTS "Require authentication for stripe_connections" ON public.stripe_connections;

-- Create a RESTRICTIVE policy that requires service role context
-- Regular users can never access this table
CREATE POLICY "Only service role can read stripe_connections"
ON public.stripe_connections
AS RESTRICTIVE
FOR SELECT
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');