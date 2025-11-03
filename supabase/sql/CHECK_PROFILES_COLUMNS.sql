-- Check what columns exist in your profiles table
-- Run this FIRST to see which column name you should use

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('segment', 'type', 'role')
ORDER BY column_name;

-- Also show all columns for reference
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

