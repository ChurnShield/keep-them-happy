-- Block anonymous access to welcome_emails table
CREATE POLICY "Block anonymous access to welcome_emails"
ON public.welcome_emails
FOR SELECT
USING (auth.uid() IS NOT NULL);