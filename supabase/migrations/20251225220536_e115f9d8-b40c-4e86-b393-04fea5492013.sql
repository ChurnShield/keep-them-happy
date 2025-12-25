-- Create enum for recovery case status
CREATE TYPE public.recovery_case_status AS ENUM ('open', 'recovered', 'expired');

-- Create enum for recovery action types
CREATE TYPE public.recovery_action_type AS ENUM ('message_sent', 'note', 'marked_recovered', 'marked_expired');

-- Create RecoveryCases table
CREATE TABLE public.recovery_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  customer_reference TEXT NOT NULL,
  invoice_reference TEXT,
  amount_at_risk NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status public.recovery_case_status NOT NULL DEFAULT 'open',
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deadline_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '48 hours'),
  first_action_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create RecoveryActions table
CREATE TABLE public.recovery_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recovery_case_id UUID NOT NULL REFERENCES public.recovery_cases(id) ON DELETE CASCADE,
  action_type public.recovery_action_type NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recovery_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_actions ENABLE ROW LEVEL SECURITY;

-- RLS policies for recovery_cases
CREATE POLICY "Users can view their own recovery cases"
ON public.recovery_cases
FOR SELECT
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can insert their own recovery cases"
ON public.recovery_cases
FOR INSERT
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update their own recovery cases"
ON public.recovery_cases
FOR UPDATE
USING (auth.uid() = owner_user_id);

-- RLS policies for recovery_actions (via case ownership)
CREATE POLICY "Users can view actions for their cases"
ON public.recovery_actions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.recovery_cases
    WHERE id = recovery_case_id AND owner_user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert actions for their cases"
ON public.recovery_actions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.recovery_cases
    WHERE id = recovery_case_id AND owner_user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_recovery_cases_updated_at
BEFORE UPDATE ON public.recovery_cases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_recovery_cases_owner_status ON public.recovery_cases(owner_user_id, status);
CREATE INDEX idx_recovery_actions_case_id ON public.recovery_actions(recovery_case_id);