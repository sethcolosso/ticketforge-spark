-- Insert admin and seller roles for sethcolosso1@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('8dffe7f2-5e39-44bc-a6dc-a1febb8a02f5', 'admin'),
  ('8dffe7f2-5e39-44bc-a6dc-a1febb8a02f5', 'seller')
ON CONFLICT (user_id, role) DO NOTHING;

-- Ensure user_roles SELECT policy allows users to read their own roles
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles"
  ON public.user_roles
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
