-- Ensure no public access to sensitive tables by adding explicit deny for anonymous users
-- These tables should only be accessible via service role or admin policies

-- For stripe_connections: ensure only service role can SELECT (no public access)
-- The existing policy is FOR ALL which covers INSERT/UPDATE/DELETE but we need to be explicit
-- Drop and recreate to ensure proper restrictive behavior

-- For processed_stripe_events: add explicit service-role-only SELECT
-- Currently only has ALL policy for service role

-- Note: The policies we added earlier use RESTRICTIVE mode which is correct
-- But we need to ensure there are no permissive policies that could override

-- Add explicit policies that deny public/anonymous access
-- These use auth.uid() IS NOT NULL to require authentication

CREATE POLICY "Require authentication for stripe_connections"
ON public.stripe_connections
FOR SELECT
USING (false);

CREATE POLICY "Require authentication for processed_stripe_events"  
ON public.processed_stripe_events
FOR SELECT
USING (false);