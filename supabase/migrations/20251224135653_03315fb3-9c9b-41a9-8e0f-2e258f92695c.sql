-- Create table to store Stripe connections
CREATE TABLE public.stripe_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  stripe_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  livemode BOOLEAN NOT NULL DEFAULT false,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stripe_connections ENABLE ROW LEVEL SECURITY;

-- Create policy for server-side access only (no client access)
-- Edge functions use service role key which bypasses RLS

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_stripe_connections_updated_at
BEFORE UPDATE ON public.stripe_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();