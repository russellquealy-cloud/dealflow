-- Fix profiles table - add all missing columns for investor and wholesaler profiles
-- Run this in your Supabase SQL Editor

-- Add missing columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state TEXT;

-- Investor-specific columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS investment_preferences TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS budget_range TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Wholesaler-specific columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_years INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialties TEXT;

-- Subscription columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- Create an index on user type for faster queries
CREATE INDEX IF NOT EXISTS profiles_type_idx ON profiles(type);

-- Update RLS policies to ensure they exist
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
    
    -- Recreate policies
    CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
    CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
    CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
    CREATE POLICY "Users can delete their own profile" ON profiles FOR DELETE USING (auth.uid() = id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

