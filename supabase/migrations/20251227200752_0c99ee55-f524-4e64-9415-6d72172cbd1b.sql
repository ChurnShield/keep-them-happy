-- Fix welcome_emails: Remove the overly permissive policy, keep only admin access
DROP POLICY IF EXISTS "Block anonymous access to welcome_emails" ON public.welcome_emails;

-- The "Only admins can view welcome emails" policy is correct, keep it
-- But ensure no INSERT/UPDATE/DELETE by regular users
CREATE POLICY "Only admins can insert welcome emails"
ON public.welcome_emails
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update welcome emails"
ON public.welcome_emails
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete welcome emails"
ON public.welcome_emails
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix stripe_connections: The service role policy should only be accessible via service role
-- Drop the current overly permissive service role policy and recreate with proper restrictions
DROP POLICY IF EXISTS "Service role can manage stripe connections" ON public.stripe_connections;

-- Service role access is handled automatically by Supabase when using service_role key
-- We just need to ensure the blocking policies are in place (they already are)