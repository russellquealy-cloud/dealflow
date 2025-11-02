-- Check what columns actually exist in the listings table
-- Run this first to see what columns are available

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'listings' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

