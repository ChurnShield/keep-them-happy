-- Create welcome_emails table for idempotency and logging
CREATE TABLE public.welcome_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resend_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on lowercase email for idempotency
CREATE UNIQUE INDEX welcome_emails_email_unique ON public.welcome_emails (LOWER(email));

-- Enable Row Level Security
ALTER TABLE public.welcome_emails ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (no public access needed)
-- No RLS policies = only service role key can read/write