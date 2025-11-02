# 🚀 Supabase Fix Instructions - Step by Step

## ⚠️ CRITICAL: Run These Fixes Before Testing

These fixes address **security vulnerabilities** and **performance issues** found in the Supabase audit.

---

## 📍 Step 1: Access SQL Editor in Supabase

1. Go to your Supabase project dashboard
2. Look for **"SQL Editor"** in the left sidebar
   - It might be near the bottom of the menu
   - Icon looks like: `</>` or `SQL`
3. Click **"New query"** button

---

## 🚨 Step 2: Enable RLS (CRITICAL - Do This First!)

**File:** `supabase/sql/FIX_RLS_ENABLE.sql`

1. Open the file in your project
2. Copy **ALL** the contents
3. Paste into SQL Editor
4. Click **"Run"** button (or press `Ctrl+Enter`)
5. Check the results - you should see:
   ```
   ✅ ENABLED for listings
   ✅ ENABLED for profiles
   ✅ ENABLED for listing_images
   ```

**⚠️ If you see errors:** Make sure your tables exist first. If they don't exist, you'll need to create them.

---

## ⚡ Step 3: Check Your Tables First (NEW!)

**File:** `supabase/sql/CHECK_TABLES_AND_COLUMNS.sql`

1. Open the file
2. Copy **ALL** contents
3. Paste into SQL Editor
4. Click **"Run"**
5. **Review the results** - this shows which tables actually exist

**If you see errors about missing columns**, use the SAFE version below instead.

---

## ⚡ Step 3b: Fix RLS Performance (Choose One Version)

### Option A: Safe Version (Recommended - Checks if tables exist)

**File:** `supabase/sql/FIX_RLS_PERFORMANCE_SAFE.sql`

1. Open the file
2. Copy **ALL** contents
3. Paste into SQL Editor
4. Click **"Run"**
5. Should see: `✅ RLS Performance fixes applied (safe version)!`

**This version only fixes tables that actually exist, prevents errors.**

### Option B: Full Version (Only if all tables exist)

**File:** `supabase/sql/FIX_RLS_PERFORMANCE.sql`

**⚠️ Only use this if you've confirmed all tables exist from Step 3!**

**This fix alone should make queries 10-50x faster!**

---

## 🔍 Step 4: Add Missing Indexes

**File:** `supabase/sql/FIX_MISSING_INDEXES.sql`

1. Copy entire file
2. Paste into SQL Editor
3. Click **"Run"**
4. Should see: `✅ Missing indexes added!`

**This improves join performance, especially for messages and watchlists.**

---

## 🧹 Step 5: Remove Duplicate Policies (Optional but Recommended)

**File:** `supabase/sql/FIX_DUPLICATE_POLICIES.sql`

1. Copy entire file
2. Paste into SQL Editor
3. Click **"Run"**
4. Should see: `✅ Duplicate policies removed!`

**Note:** This removes duplicate policies. Make sure you have at least one policy per table/action after running this.

---

## ✅ Step 6: Verify Everything Works

### Check RLS is Enabled:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('listings', 'profiles', 'listing_images');
```

All should show `rowsecurity = true`

### Check Policies Exist:
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('listings', 'profiles', 'messages')
ORDER BY tablename, policyname;
```

Should see policies listed for each table.

---

## 💰 Database Upgrade (Recommended)

### Current: NANO Plan
- ❌ 0.5 GB memory (too low)
- ❌ Shared CPU (unpredictable)
- ⚠️ Likely causing your timeout issues

### Recommended: MICRO Plan
- ✅ 1 GB memory (2x improvement)
- ✅ Dedicated 2-core CPU
- ✅ ~$10/month
- ✅ Should fix listings timeout

### How to Upgrade:
1. Supabase Dashboard → **Settings** → **Infrastructure**
2. Or: **Database** → **Settings** → **Compute Size**
3. Select **MICRO** ($0.01344/hour)
4. Click **"Upgrade"** or **"Save"**
5. Wait 1-2 minutes for upgrade to apply

**After upgrade, restart your app or wait a few minutes for changes to take effect.**

---

## 🐛 Troubleshooting

### "Table doesn't exist" Error
- Some tables might not be created yet
- Skip those lines or create tables first
- Check which tables you actually have: `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`

### "Policy already exists" Error
- This is normal - the scripts use `DROP POLICY IF EXISTS` first
- If you see this, the script handled it automatically

### "Permission denied" Error
- Make sure you're using the **SQL Editor** (not client library)
- SQL Editor runs with admin privileges
- You should have full access

### Can't Find SQL Editor?
- Look for `</>` icon in left sidebar
- Might be under **"Tools"** or **"Database"** menu
- Alternative: Use Supabase CLI if you have it installed

---

## 📊 Expected Performance Improvements

**Before Fixes:**
- Listings page: 30-45 seconds (timeout)
- Messages page: Stuck loading
- Watchlist: Slow or timeout

**After Fixes:**
- Listings page: < 5 seconds (hopefully!)
- Messages page: < 2 seconds
- Watchlist: < 1 second

**After Database Upgrade:**
- Listings page: < 3 seconds
- Much more reliable, no timeouts
- Can handle more concurrent users

---

## 🎯 Priority Order

**Must Do Now:**
1. ✅ Enable RLS (security critical!)
2. ✅ Fix RLS performance (huge speed boost)

**Should Do This Week:**
3. ✅ Add missing indexes
4. ✅ Remove duplicate policies
5. ✅ Upgrade database to MICRO

**Nice to Have:**
6. ⚠️ Fix function search paths (security)
7. ⚠️ Enable leaked password protection

---

## 📝 Notes

- **Backup First:** Supabase has automatic backups, but if you're worried, export your data first
- **Test After:** After running fixes, test your app to make sure everything still works
- **Monitor:** Watch Supabase logs for any errors after applying fixes
- **Rollback:** If something breaks, Supabase has point-in-time recovery you can use

---

**Questions? Check `SUPABASE_CRITICAL_FIXES.md` for more details.**
