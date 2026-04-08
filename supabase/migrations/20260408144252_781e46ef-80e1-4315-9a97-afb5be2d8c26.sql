
-- Add guest_email to orders for guest checkout
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.orders ADD COLUMN guest_email text;

-- Allow anonymous inserts for guest checkout
CREATE POLICY "Anyone can insert guest orders"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL AND guest_email IS NOT NULL);

-- Allow guests to view orders by checking session (handled in app via order_code)
-- We'll rely on authenticated policies for viewing

-- Function to link guest orders to user on login/signup
CREATE OR REPLACE FUNCTION public.link_guest_orders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET user_id = NEW.id
  WHERE guest_email = NEW.email
    AND user_id IS NULL;
  RETURN NEW;
END;
$$;

-- Trigger on auth.users to link orders on signup
CREATE TRIGGER on_auth_user_created_link_orders
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.link_guest_orders();
