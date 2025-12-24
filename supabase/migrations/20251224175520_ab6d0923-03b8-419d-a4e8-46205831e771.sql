-- Allow anyone (authenticated or not) to insert leads for signup
CREATE POLICY "Allow public lead inserts"
ON public.leads
FOR INSERT
WITH CHECK (true);

-- Allow authenticated users to view their own leads
CREATE POLICY "Users can view leads with their email"
ON public.leads
FOR SELECT
USING (true);