-- Promote Daddy Jo, Nene Ella, and Wowa Grace to admin role
-- Run this in Supabase Dashboard → SQL Editor

UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  '734bb23e-67c8-45b1-aa96-5b16e47e65f8',  -- Daddy Jo
  '67ece304-8904-4a34-9bb9-a748c6a413d7',  -- Nene Ella
  'ad14dd2f-6e7a-4c93-85e0-a8e7e0ed1977'   -- Wowa Grace
);

-- Also add a policy so admins can update any profile role in future
-- (allows the promote-to-admin.js script to work)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK (true);

-- Verify
SELECT display_name, role FROM public.profiles ORDER BY display_name;
