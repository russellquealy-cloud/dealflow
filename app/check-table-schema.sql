-- Check what columns actually exist in your listings table
-- Run this first to see what columns are available

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'listings' 
ORDER BY ordinal_position;
