-- Step 1: Add email column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Step 2: Create index for lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Step 3: Backfill existing profiles from auth.users
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id
AND p.email IS NULL;

-- Step 4: Update trigger function to copy email for new signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data ->> 'display_name', null),
    new.email
  );
  RETURN new;
END;
$function$;