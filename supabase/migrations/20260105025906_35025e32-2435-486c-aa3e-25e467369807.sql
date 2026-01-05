-- Create cancel_flow_config table
CREATE TABLE public.cancel_flow_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  survey_options jsonb DEFAULT '{"reasons": ["too_expensive", "not_using_enough", "missing_features", "found_alternative", "technical_issues", "need_a_break"], "custom_reasons": [], "display_order": ["too_expensive", "not_using_enough", "missing_features", "found_alternative", "technical_issues", "need_a_break"]}'::jsonb,
  offer_settings jsonb DEFAULT '{"default_offer": "none", "reason_mappings": {}, "discount_percentage": 20, "discount_duration_months": 3, "pause_duration_months": 1}'::jsonb,
  branding jsonb DEFAULT '{"primary_color": "#14B8A6", "logo_url": null, "dark_mode": true}'::jsonb,
  widget_settings jsonb DEFAULT '{"display_mode": "modal", "accept_button_text": "Accept Offer", "decline_button_text": "Continue Cancellation"}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(profile_id)
);

-- Create cancel_sessions table
CREATE TABLE public.cancel_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  session_token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'started',
  exit_reason text,
  custom_feedback text,
  offer_type_presented text,
  offer_accepted boolean,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create saved_customers table
CREATE TABLE public.saved_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cancel_session_id uuid NOT NULL REFERENCES public.cancel_sessions(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  save_type text NOT NULL,
  original_mrr numeric NOT NULL,
  new_mrr numeric NOT NULL,
  discount_percentage integer,
  pause_months integer,
  stripe_action_id text,
  churnshield_fee_per_month numeric GENERATED ALWAYS AS (LEAST(new_mrr * 0.20, 500)) STORED,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.cancel_flow_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancel_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_customers ENABLE ROW LEVEL SECURITY;

-- RLS policies for cancel_flow_config
CREATE POLICY "Users can view their own config"
ON public.cancel_flow_config FOR SELECT
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own config"
ON public.cancel_flow_config FOR INSERT
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own config"
ON public.cancel_flow_config FOR UPDATE
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Service role can manage cancel_flow_config"
ON public.cancel_flow_config FOR ALL
USING (true)
WITH CHECK (true);

-- RLS policies for cancel_sessions
CREATE POLICY "Users can view their own sessions"
ON public.cancel_sessions FOR SELECT
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own sessions"
ON public.cancel_sessions FOR INSERT
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own sessions"
ON public.cancel_sessions FOR UPDATE
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Service role can manage cancel_sessions"
ON public.cancel_sessions FOR ALL
USING (true)
WITH CHECK (true);

-- RLS policies for saved_customers
CREATE POLICY "Users can view their own saved customers"
ON public.saved_customers FOR SELECT
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Service role can manage saved_customers"
ON public.saved_customers FOR ALL
USING (true)
WITH CHECK (true);

-- Add updated_at trigger to cancel_flow_config
CREATE TRIGGER update_cancel_flow_config_updated_at
BEFORE UPDATE ON public.cancel_flow_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();