-- Add unique constraint on cancel_session_id to prevent duplicate saves for same session
ALTER TABLE saved_customers
ADD CONSTRAINT unique_cancel_session_save
UNIQUE (cancel_session_id);

-- Add a save_month column for monthly uniqueness tracking (populated by trigger)
ALTER TABLE saved_customers 
ADD COLUMN save_month text;

-- Backfill existing rows with their month
UPDATE saved_customers 
SET save_month = to_char(created_at, 'YYYY-MM')
WHERE save_month IS NULL;

-- Create trigger function to set save_month on insert
CREATE OR REPLACE FUNCTION public.set_save_month()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.save_month := to_char(COALESCE(NEW.created_at, now()), 'YYYY-MM');
  RETURN NEW;
END;
$$;

-- Create trigger to run before insert
CREATE TRIGGER set_save_month_trigger
BEFORE INSERT ON saved_customers
FOR EACH ROW
EXECUTE FUNCTION public.set_save_month();

-- Create unique index on subscription_id + save_month to prevent duplicate saves in same billing month
CREATE UNIQUE INDEX unique_subscription_save_per_month
ON saved_customers (subscription_id, save_month)
WHERE subscription_id IS NOT NULL;