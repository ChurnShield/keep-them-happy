-- Block all public/user access to welcome_emails (already has admin SELECT)
CREATE POLICY "Block non-admin access to welcome_emails"
ON public.welcome_emails
FOR SELECT
USING (false);

-- Block INSERT/UPDATE/DELETE for non-service-role on stripe_connections
CREATE POLICY "Block user INSERT on stripe_connections"
ON public.stripe_connections
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Block user UPDATE on stripe_connections"
ON public.stripe_connections
FOR UPDATE
USING (false);

CREATE POLICY "Block user DELETE on stripe_connections"
ON public.stripe_connections
FOR DELETE
USING (false);

-- Block non-admin SELECT on leads table
CREATE POLICY "Block non-admin SELECT on leads"
ON public.leads
FOR SELECT
USING (false);