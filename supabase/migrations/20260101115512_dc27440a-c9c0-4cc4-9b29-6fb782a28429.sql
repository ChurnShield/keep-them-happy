-- Create oauth_states table for CSRF protection
CREATE TABLE public.oauth_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  state TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes')
);

-- Enable RLS
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- Only service role can manage oauth states (edge functions use service role)
CREATE POLICY "Service role can manage oauth states"
ON public.oauth_states
FOR ALL
USING (true)
WITH CHECK (true);

-- Add index for quick state lookups
CREATE INDEX idx_oauth_states_state ON public.oauth_states(state);

-- Add index for cleanup queries
CREATE INDEX idx_oauth_states_expires ON public.oauth_states(expires_at);