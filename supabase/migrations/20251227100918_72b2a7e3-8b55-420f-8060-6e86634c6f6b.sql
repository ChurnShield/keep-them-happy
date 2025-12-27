-- Add admin oversight policy for customers table
-- Admins can view all customer data for support purposes
CREATE POLICY "Admins can view all customers"
ON public.customers
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add service role policy for backend operations
CREATE POLICY "Service role can manage customers"
ON public.customers
FOR ALL
USING (true)
WITH CHECK (true);