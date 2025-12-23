-- Create a unique index on lowercase email to enforce case-insensitive uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS leads_email_unique_lower ON public.leads (lower(email));