-- Drop existing policies on welcome_emails to fix the security issue
DROP POLICY IF EXISTS "Admins can view welcome emails" ON public.welcome_emails;
DROP POLICY IF EXISTS "Block non-admin access to welcome_emails" ON public.welcome_emails;

-- Create a proper admin-only policy using the correct has_role signature
CREATE POLICY "Only admins can view welcome emails"
ON public.welcome_emails
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);