-- Add verified seller column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

-- Allow admins to update profiles (for verification)
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
