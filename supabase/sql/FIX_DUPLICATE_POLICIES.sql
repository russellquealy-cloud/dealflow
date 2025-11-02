-- 🧹 REMOVE DUPLICATE RLS POLICIES
-- Keep only the most complete policies, remove duplicates

-- ========================================
-- LISTINGS TABLE - Remove duplicates, keep best
-- ========================================
-- Keep: listings_read_all, listings_owner_write (or most comprehensive)
-- Remove old duplicate policies
DROP POLICY IF EXISTS "Allow public read access" ON listings;
DROP POLICY IF EXISTS "Allow users to delete own listings" ON listings;
DROP POLICY IF EXISTS "Allow users to insert own listings" ON listings;
DROP POLICY IF EXISTS "Allow users to update own listings" ON listings;
DROP POLICY IF EXISTS "Public can read listings" ON listings;
DROP POLICY IF EXISTS "Users can delete their own listings" ON listings;
DROP POLICY IF EXISTS "Users can insert their own listings" ON listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON listings;
DROP POLICY IF EXISTS "owner can delete listings" ON listings;
DROP POLICY IF EXISTS "owner can insert listings" ON listings;
DROP POLICY IF EXISTS "owner can read own" ON listings;
DROP POLICY IF EXISTS "owner can update listings" ON listings;
DROP POLICY IF EXISTS "owner deletes own" ON listings;
DROP POLICY IF EXISTS "owner inserts own" ON listings;
DROP POLICY IF EXISTS "owner updates own" ON listings;
DROP POLICY IF EXISTS "public can read live listings or owner can read own" ON listings;
DROP POLICY IF EXISTS "read live" ON listings;
DROP POLICY IF EXISTS listings_delete_owner_only ON listings;
DROP POLICY IF EXISTS listings_insert_owner_only ON listings;
DROP POLICY IF EXISTS listings_update_owner_only ON listings;
DROP POLICY IF EXISTS listings_select_live_or_owner ON listings;

-- Keep these (or create comprehensive ones if they don't exist)
-- listings_read_all should allow public read of live listings
-- listings_owner_write should allow owner to do all operations

-- ========================================
-- LISTING_IMAGES TABLE - Remove duplicates
-- ========================================
DROP POLICY IF EXISTS "allow owners to delete images" ON listing_images;
DROP POLICY IF EXISTS "allow owners to insert images" ON listing_images;
DROP POLICY IF EXISTS "allow owners to update images" ON listing_images;
DROP POLICY IF EXISTS "allow owners or public to view images" ON listing_images;
DROP POLICY IF EXISTS "owner can delete images" ON listing_images;
DROP POLICY IF EXISTS "owner can insert images" ON listing_images;
DROP POLICY IF EXISTS "owner can update images" ON listing_images;
DROP POLICY IF EXISTS "public can read images of live listings or owner can read own i" ON listing_images;

-- Keep these (if they exist and are comprehensive)
-- listing_images_select_own
-- listing_images_insert_own
-- listing_images_update_own
-- listing_images_delete_own

-- ========================================
-- PROFILES TABLE - Remove duplicates
-- ========================================
DROP POLICY IF EXISTS "own profile" ON profiles;
-- Keep: "Users can view all profiles", "Users can view their own profile", etc.

-- ========================================
-- ORG_MEMBERS TABLE - Remove duplicates
-- ========================================
DROP POLICY IF EXISTS "Org owners can manage members" ON org_members;
-- Keep: "Users can view org members of their orgs"

-- ========================================
-- ORGS TABLE - Remove duplicates
-- ========================================
-- Keep: "Users can view orgs they belong to", "Owners can manage their orgs"

-- ========================================
-- USAGE_COUNTERS TABLE - Remove duplicates
-- ========================================
-- Both "Users can view their own usage" and "Users can update their own usage" are needed
-- But make sure there's only one of each

SELECT '✅ Duplicate policies removed!' as status;
