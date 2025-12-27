-- Fix leads table public exposure
-- Drop the overly permissive SELECT policy that exposes all lead emails
DROP POLICY IF EXISTS "Users can view leads with their email" ON public.leads;

-- Clean up duplicate INSERT policies
DROP POLICY IF EXISTS "Allow public lead inserts" ON public.leads;
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.leads;

-- Keep only one anonymous INSERT policy for lead submissions
CREATE POLICY "Allow anonymous lead submission"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Add admin-only SELECT policy for leads
CREATE POLICY "Admins can view all leads"
ON public.leads
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));