-- Add 'role' column to profiles table if it doesn't exist
-- This will help with the user_alerts table seeding

-- Check if column exists and add it if it doesn't
DO $$
BEGIN
  -- Add role column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role TEXT;
    
    -- If segment column exists, copy values from segment to role
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'segment'
    ) THEN
      UPDATE profiles SET role = segment WHERE segment IS NOT NULL;
    END IF;
    
    -- If type column exists and role is still null, copy from type
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'type'
    ) THEN
      UPDATE profiles SET role = type WHERE role IS NULL AND type IS NOT NULL;
    END IF;
    
    -- Set default for any remaining null values
    UPDATE profiles SET role = 'investor' WHERE role IS NULL;
    
    -- Add check constraint
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
      CHECK (role IN ('investor', 'wholesaler', 'admin'));
    
    RAISE NOTICE '✅ Added role column to profiles table';
  ELSE
    RAISE NOTICE 'ℹ️ role column already exists in profiles table';
  END IF;
END $$;

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name IN ('role', 'segment', 'type')
ORDER BY column_name;

SELECT '✅ Script completed. Check the results above to see which columns exist.' as status;

