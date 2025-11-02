-- Enable Leaked Password Protection in Supabase Auth
-- This prevents users from using compromised passwords by checking against HaveIBeenPwned.org
--
-- NOTE: This must be enabled through the Supabase Dashboard UI, not via SQL
-- This file serves as documentation of the setting that needs to be enabled.
--
-- Steps to enable:
-- 1. Go to Supabase Dashboard: https://app.supabase.com
-- 2. Select your project
-- 3. Go to Authentication → Settings
-- 4. Scroll to "Password" section
-- 5. Enable "Leaked Password Protection"
-- 6. Click "Save"
--
-- This feature:
-- - Checks passwords against HaveIBeenPwned.org database
-- - Blocks commonly compromised passwords
-- - Enhances security without user friction
-- - Takes 2 minutes to enable
--
-- Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

SELECT '✅ Please enable Leaked Password Protection in Supabase Dashboard → Authentication → Settings → Password' as instruction;

