
-- Create triggers that don't exist yet (on_auth_user_created already exists)
DROP TRIGGER IF EXISTS on_admin_user_created ON auth.users;
CREATE TRIGGER on_admin_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_admin_role();

DROP TRIGGER IF EXISTS on_order_item_created ON public.order_items;
CREATE TRIGGER on_order_item_created
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.process_ticket_sale();

DROP TRIGGER IF EXISTS on_events_updated ON public.events;
CREATE TRIGGER on_events_updated
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Fix existing users: ensure profiles and roles exist
INSERT INTO public.profiles (id, first_name, last_name)
SELECT id, COALESCE(raw_user_meta_data->>'first_name', ''), COALESCE(raw_user_meta_data->>'last_name', '')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'buyer'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles WHERE role = 'buyer')
ON CONFLICT DO NOTHING;

-- Assign admin+seller to sethcolosso1@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'sethcolosso1@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'seller' FROM auth.users WHERE email = 'sethcolosso1@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
