-- Update the handle_new_user trigger to handle seller role assignment from signup metadata
-- This allows users to sign up as sellers instead of always being assigned as buyers

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
BEGIN
  -- Create profile with user info
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  
  -- Get the role from user metadata, default to 'buyer'
  -- This allows signup to pass role='seller' in the metadata to become a seller
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'buyer'::app_role);
  
  -- Assign the role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  
  RETURN NEW;
END;
$$;
