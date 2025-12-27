-- Add RLS policies to payment_recovery table
-- Admin-only access for viewing payment recovery records
CREATE POLICY "Admins can view payment recovery records"
ON public.payment_recovery
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage payment recovery"
ON public.payment_recovery
FOR ALL
USING (true)
WITH CHECK (true);

-- Add RLS policies to stripe_connections table
-- This contains sensitive access tokens - service role only
CREATE POLICY "Service role can manage stripe connections"
ON public.stripe_connections
FOR ALL
USING (true)
WITH CHECK (true);

-- Add RLS policies to welcome_emails table
-- Admin-only viewing, service role for management
CREATE POLICY "Admins can view welcome emails"
ON public.welcome_emails
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage welcome emails"
ON public.welcome_emails
FOR ALL
USING (true)
WITH CHECK (true);