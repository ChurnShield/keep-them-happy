-- Create leads table for capturing signups
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  company text NOT NULL,
  plan_interest text NULL,
  source text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to INSERT (for signup form)
CREATE POLICY "Allow anonymous insert"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (true);

-- No SELECT policy for anon - leads are private