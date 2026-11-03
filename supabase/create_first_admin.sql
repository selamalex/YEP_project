-- ==============================================================================
-- Securely Grant First Administrator Privileges
-- ==============================================================================
-- Instructions:
-- 1. Create a user in Supabase Auth:
--    Dashboard -> Authentication -> Users -> "Add User" -> "Create User"
--    Enter the administrator's email and a strong password.
--    (Ensure "Auto Confirm" is checked if you want them to log in immediately).
--
-- 2. Run the following query in Supabase Dashboard -> SQL Editor,
--    replacing 'admin@yepinitiative.org' with the email you registered:

INSERT INTO public.admin_users (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'admin@yepinitiative.org'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 3. Verify the user has been granted admin access:
SELECT u.id, u.email, a.role, a.created_at
FROM auth.users u
JOIN public.admin_users a ON u.id = a.id
WHERE u.email = 'admin@yepinitiative.org';

