-- Insert admin and seller roles for sethcolosso1@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'sethcolosso1@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'seller'::public.app_role
FROM auth.users
WHERE email = 'sethcolosso1@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Ensure user_roles SELECT policy allows users to read their own roles
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles"
  ON public.user_roles
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
