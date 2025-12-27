-- Fix recovery_cases: Prevent owner_user_id from being changed after creation
-- Create a trigger to block owner_user_id updates
CREATE OR REPLACE FUNCTION public.prevent_owner_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.owner_user_id IS DISTINCT FROM NEW.owner_user_id THEN
    RAISE EXCEPTION 'Cannot change owner_user_id after case creation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER prevent_recovery_case_owner_change
  BEFORE UPDATE ON public.recovery_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_owner_change();

-- Fix stripe_invoices: Add NOT NULL constraint on user_id if not already present
-- First check and add constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stripe_invoices' 
    AND column_name = 'user_id' 
    AND is_nullable = 'YES'
  ) THEN
    -- Update any NULL user_ids first (if any exist)
    -- Then alter the column
    ALTER TABLE public.stripe_invoices 
    ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;