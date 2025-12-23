-- Create function to update timestamps (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create enum for payment recovery status
CREATE TYPE public.payment_recovery_status AS ENUM ('needs_payment', 'emailed_1', 'emailed_2', 'resolved');

-- Create payment_recovery table
CREATE TABLE public.payment_recovery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  status payment_recovery_status NOT NULL DEFAULT 'needs_payment',
  last_emailed_at TIMESTAMP WITH TIME ZONE,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT payment_recovery_email_unique UNIQUE (email),
  CONSTRAINT payment_recovery_attempt_limit CHECK (attempt_count <= 2)
);

-- Enable RLS
ALTER TABLE public.payment_recovery ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE TRIGGER update_payment_recovery_updated_at
  BEFORE UPDATE ON public.payment_recovery
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();