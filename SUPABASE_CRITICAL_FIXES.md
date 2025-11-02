# 🚨 CRITICAL Supabase Security & Performance Fixes

**Priority: URGENT** - Security vulnerabilities found that need immediate attention.

---

## 🔴 CRITICAL SECURITY ISSUES (Fix First!)

### 1. **RLS NOT ENABLED on Critical Tables**
**Problem:** You have RLS policies created, but RLS is **NOT ENABLED** on the tables. This means **ANYONE can access your data** - policies are being ignored!

**Affected Tables:**
- ✅ `listings` - **PUBLIC DATA IS EXPOSED!**
- ✅ `profiles` - **USER DATA IS EXPOSED!**
- ✅ `listing_images` - **IMAGES ARE EXPOSED!**
- ⚠️ `subscription_plans` - No RLS at all
- ⚠️ `spatial_ref_sys` - PostGIS system table (less critical)

**How to Fix:**

1. **Find RLS in Supabase:**
   - Go to your Supabase project dashboard
   - Click **"Database"** in the left sidebar
   - Click **"Tables"** in the submenu
   - Click on a table name (e.g., `listings`)
   - Look for **"Row Level Security"** tab/section
   - OR use the SQL Editor and run these commands:

```sql
-- Enable RLS on critical tables
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
```

**⚠️ WARNING:** Make sure your RLS policies are correct before enabling! Once enabled, if policies are wrong, legitimate users might be blocked.

---

### 2. **Security Definer Views** 
**Problem:** Views using `SECURITY DEFINER` can bypass RLS. Potential security risk.

**Affected Views:**
- `listings_geo`
- `admin_dashboard`

**Fix:** Review these views and ensure they're secure or convert to `SECURITY INVOKER`.

---

## ⚠️ HIGH PRIORITY PERFORMANCE ISSUES

### 3. **RLS Policy Performance (Auth Function Calls)**

**Problem:** RLS policies are calling `auth.uid()` or `auth.email()` directly, causing them to be re-evaluated for **every single row**. This is extremely slow.

**Solution:** Wrap auth functions in `(select ...)` to cache the result:

**Before (SLOW):**
```sql
CREATE POLICY "Users can view their own subscription"
ON subscriptions FOR SELECT
USING (user_id = auth.uid());
```

**After (FAST):**
```sql
CREATE POLICY "Users can view their own subscription"
ON subscriptions FOR SELECT
USING (user_id = (select auth.uid()));
```

**Affected Tables (50+ policies!):**
- subscriptions (3 policies)
- subscription_usage (3 policies)
- contact_logs (2 policies)
- ai_analysis_logs (2 policies)
- admin_analytics (1 policy)
- admin_metrics (1 policy)
- user_activity_logs (2 policies)
- system_settings (1 policy)
- buyers (2 policies)
- orgs (2 policies)
- crm_exports (2 policies)
- user_alerts (4 policies)
- org_members (2 policies)
- usage_counters (2 policies)
- watchlists (1 policy)
- alerts (1 policy)
- user_watchlists (4 policies)
- watchlist_items (3 policies)
- support_tickets (3 policies)
- user_feedback (3 policies)
- messages (3 policies)
- saved_searches (4 policies)

**Quick Fix Script:**
I can generate a complete SQL script to fix all of these at once. This will significantly improve query performance, especially for the listings page.

---

### 4. **Multiple Duplicate RLS Policies**

**Problem:** You have duplicate policies on the same table/action/role. Postgres evaluates ALL of them, causing unnecessary overhead.

**Worst Offenders:**
- `listings` table: **7 duplicate policies for SELECT** (anon, authenticated, etc.)
- `listing_images`: **4 duplicate policies** for each action
- `profiles`: **3 duplicate policies** for SELECT

**Fix:** Remove duplicate policies, keeping only the most restrictive/complete ones.

---

## 📊 MEDIUM PRIORITY PERFORMANCE

### 5. **Missing Foreign Key Indexes**

**Problem:** Foreign keys without indexes cause slow joins and updates.

**Affected:**
- `messages.to_id` → `profiles.id` (critical for messages page!)
- `watchlists.property_id` → `listings.id` (critical for watchlists!)
- Several others

**Fix:** Add indexes:
```sql
CREATE INDEX IF NOT EXISTS idx_messages_to_id ON messages(to_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_property_id ON watchlists(property_id);
CREATE INDEX IF NOT EXISTS idx_orgs_owner_id ON orgs(owner_id);
-- ... (more in script)
```

---

### 6. **Unused Indexes**

**Problem:** You have 47 unused indexes taking up space and slowing writes.

**Note:** Some may become useful as queries change. Don't delete all at once - monitor first.

---

## 🔧 MEDIUM PRIORITY SECURITY

### 7. **Function Search Path Security**

**Problem:** Functions without `SET search_path` can be vulnerable.

**Affected Functions:**
- `get_user_subscription_tier`
- `listings_in_bbox`
- `increment_usage`
- And 8 more...

**Fix:** Add `SET search_path = ''` to function definitions.

---

### 8. **Extension in Public Schema**

**Problem:** `postgis` extension in public schema.

**Fix:** Move to separate schema (less critical, but good practice).

---

### 9. **Leaked Password Protection**

**Problem:** Supabase Auth "Leaked Password Protection" is disabled.

**Fix:** Enable in Supabase Dashboard → Authentication → Password Settings.

---

## 💰 Database Upgrade Recommendation

### **Current Plan: NANO**
- **Memory:** 0.5 GB (very limited)
- **CPU:** Shared (unpredictable performance)
- **Cost:** $0/hour

### **Recommendation for Production:**

**Minimum:** Upgrade to **MICRO** ($0.01344/hour ≈ $10/month)
- ✅ **1 GB memory** (2x current)
- ✅ **2-core ARM CPU** (dedicated)
- ✅ **Significant performance improvement**
- ✅ **Still very affordable**

**Better Option:** **SMALL** ($0.0206/hour ≈ $15/month)
- ✅ **2 GB memory** (4x current)
- ✅ **2-core ARM CPU** (dedicated)
- ✅ **Much better for production traffic**
- ✅ **Still very affordable**

**Why Upgrade?**
1. **Shared CPU** on NANO means unpredictable performance
2. **0.5 GB memory** is very limiting - can cause slow queries, timeouts
3. Your listings page is timing out - this is likely part of the problem
4. With RLS fixes + upgrade, you should see **10-50x performance improvement**

**Cost Comparison:**
- MICRO: ~$10/month (vs $0) - **Highly Recommended**
- SMALL: ~$15/month (vs $0) - **Best Value for Production**

---

## 📋 Action Plan (Priority Order)

### **Immediate (Before Testing):**
1. ✅ **Enable RLS on critical tables** (listings, profiles, listing_images)
2. ✅ **Fix RLS policy auth function calls** (wrap in `select`)
3. ✅ **Remove duplicate RLS policies**

### **This Week:**
4. ✅ **Add missing foreign key indexes** (especially messages, watchlists)
5. ✅ **Upgrade database to MICRO** (at minimum)
6. ✅ **Enable leaked password protection**

### **Next Sprint:**
7. ⚠️ Fix Security Definer views
8. ⚠️ Fix function search paths
9. ⚠️ Monitor and remove unused indexes (gradually)

---

## 🛠️ How to Apply Fixes

### **Option 1: Use Supabase Dashboard**
1. Go to **Database** → **SQL Editor**
2. Copy/paste the fix scripts (I'll generate these)
3. Run the scripts

### **Option 2: Migration Files**
I can create SQL migration files you can run in order.

---

## 📝 Finding RLS in Supabase Dashboard

**If you can't find RLS tab:**
1. **Database** → **Tables** → Click table name
2. Look for tabs: **"Table editor"**, **"Relationships"**, **"RLS"**, **"Settings"**
3. If not visible, try **"Settings"** tab - RLS toggle might be there
4. **Alternative:** Use SQL Editor directly with `ALTER TABLE` commands

**Or use SQL Editor:**
1. Go to **Database** → **SQL Editor**
2. Create new query
3. Run: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
4. This shows which tables have RLS enabled

---

---

## 📁 SQL Fix Scripts Generated

I've created the following SQL scripts in `supabase/sql/`:

1. **`FIX_RLS_ENABLE.sql`** - Enable RLS on critical tables (RUN FIRST!)
2. **`FIX_RLS_PERFORMANCE.sql`** - Fix all auth function calls (huge performance boost)
3. **`FIX_MISSING_INDEXES.sql`** - Add missing foreign key indexes
4. **`FIX_DUPLICATE_POLICIES.sql`** - Remove duplicate policies

**Run in this order:**
1. FIX_RLS_ENABLE.sql (CRITICAL - do this first!)
2. FIX_RLS_PERFORMANCE.sql (Major performance boost)
3. FIX_MISSING_INDEXES.sql (Improves joins)
4. FIX_DUPLICATE_POLICIES.sql (Cleans up duplicates)

---

## 🎯 Quick Start Guide

### Step 1: Find SQL Editor in Supabase
1. Go to your Supabase project dashboard
2. Click **"SQL Editor"** in the left sidebar (usually near the bottom)
3. Click **"New query"** button

### Step 2: Run Fix Scripts
1. Open `supabase/sql/FIX_RLS_ENABLE.sql`
2. Copy entire contents
3. Paste into SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)
5. Repeat for other scripts in order

### Step 3: Verify
After running `FIX_RLS_ENABLE.sql`, you should see:
```
✅ ENABLED for listings
✅ ENABLED for profiles
✅ ENABLED for listing_images
```

If you see ❌ DISABLED, RLS is still not enabled (check for errors).

---

## 💡 About Screenshot 1 (Database Compute)

**Current:** NANO plan ($0/hour)
- **Memory:** 0.5 GB
- **CPU:** Shared
- **Status:** ⚠️ Not suitable for production

**Recommendation:** Upgrade to **MICRO** ($10/month)
- **Memory:** 1 GB (2x improvement)
- **CPU:** 2-core ARM (dedicated, predictable)
- **Impact:** Should fix listings timeout issues

**How to Upgrade:**
1. In Supabase Dashboard, go to **Settings** → **Infrastructure**
2. Or look for **"Database"** → **"Settings"** → **"Compute"**
3. Select **MICRO** plan
4. Confirm upgrade

**After upgrade + RLS fixes, you should see 10-50x performance improvement!**

---

## 📞 Can't Find RLS Tab?

**Alternative Method:**
1. Use **SQL Editor** directly (easiest)
2. Run: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'listings';`
3. If `rowsecurity = false`, RLS is disabled
4. Run `ALTER TABLE listings ENABLE ROW LEVEL SECURITY;`

**Or check Settings:**
1. Database → Tables → listings
2. Look for gear icon ⚙️ or "Settings" button
3. Should have RLS toggle there

**If still can't find:**
- Use SQL Editor - it's the most reliable method
- All fixes can be done via SQL
