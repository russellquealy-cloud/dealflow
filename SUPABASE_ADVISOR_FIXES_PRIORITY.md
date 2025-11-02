# 📊 Supabase Advisor Results - Priority Fix Guide

**Date:** After initial RLS fixes  
**Status:** Reviewing remaining issues

---

## ✅ **What We've Already Fixed**

1. ✅ RLS enabled on critical tables
2. ✅ RLS performance for core tables (messages, watchlists, alerts, saved_searches, etc.)
3. ✅ Missing indexes added
4. ✅ Duplicate policies removed

---

## 🔴 **CRITICAL - Fix These Now**

### 1. **Remaining RLS Policy Optimizations** ⚡ **CRITICAL FOR PERFORMANCE**

**Problem:** Many RLS policies still use `auth.uid()` directly instead of `(select auth.uid())`, causing them to be re-evaluated for every row. This is a **huge performance bottleneck**.

**Affected Tables:**
- `listing_images` (4 policies)
- `listings` (1 policy - listings_owner_write)
- `profiles` (1 policy - delete)
- `orgs` (2 policies)
- `buyers` (2 policies)
- `admin_analytics`, `admin_metrics`, `system_settings`
- `user_activity_logs` (2 policies)
- `crm_exports`, `user_alerts`, `org_members`, `usage_counters`
- `user_watchlists`, `watchlist_items`, `support_tickets`, `user_feedback`

**Fix:** Run `supabase/sql/FIX_REMAINING_RLS_POLICIES.sql`

**Impact:** This will give you another **10-50x performance boost** on queries involving these tables!

**Priority:** 🔴 **DO THIS FIRST** - Performance critical!

---

### 2. **Security Definer Views** ⚠️ **SECURITY RISK**

**Problem:** Views `listings_geo` and `admin_dashboard` use `SECURITY DEFINER`, which can bypass RLS in some cases.

**Impact:** Potential security issue if views access sensitive data.

**Fix:** Run `supabase/sql/FIX_SECURITY_ISSUES.sql` (will need manual view recreation)

**Priority:** 🟡 **Medium** - Fix soon but not blocking

---

### 3. **Missing RLS Policy on subscription_plans** ⚠️

**Problem:** Table has RLS enabled but no policies, so no one can read it.

**Impact:** Subscription plans page won't work.

**Fix:** Included in `FIX_SECURITY_ISSUES.sql`

**Priority:** 🟡 **Medium** - Fix if you're using subscription plans table

---

## 🟡 **MEDIUM PRIORITY - Fix When You Have Time**

### 4. **Function Search Path Security** (13 functions)

**Problem:** Functions don't have `SET search_path` defined, potential security issue.

**Affected Functions:**
- `get_user_subscription_tier`
- `listings_in_bbox` (2 versions)
- `increment_usage`
- `find_matching_buyers`
- `get_buyer_stats`
- `promote_to_admin`
- `update_subscription_usage`
- `log_user_activity`
- `increment_subscription_usage`
- `sync_geom_from_latlon`
- `update_admin_metrics`
- `can_user_perform_action`

**Impact:** Low - mostly internal functions, but good security practice.

**Fix:** Add `SET search_path = ''` to each function definition.

**Priority:** 🟡 **Low-Medium** - Security hardening, not urgent

---

### 5. **PostGIS Extension in Public Schema**

**Problem:** `postgis` extension installed in `public` schema.

**Impact:** Very low - mostly organizational.

**Fix:** Move to separate schema (advanced, can skip for now).

**Priority:** 🟢 **Low** - Can ignore for now

---

### 6. **Leaked Password Protection Disabled**

**Problem:** Supabase Auth not checking against HaveIBeenPwned.

**Impact:** Users can use compromised passwords.

**Fix:** Enable in Supabase Dashboard → Authentication → Password Settings

**Priority:** 🟡 **Medium** - Good security practice

---

## 🟢 **LOW PRIORITY - Can Ignore for Now**

### 7. **Multiple Permissive Policies** (Some still exist)

**Problem:** A few tables still have duplicate policies.

**Affected:**
- `listings` (1 duplicate - listings_owner_write + listings_read_all)
- `orgs` (duplicate SELECT policies)
- `profiles` (duplicate SELECT policies)
- `usage_counters` (duplicate SELECT policies)
- `user_activity_logs` (duplicate SELECT policies)

**Impact:** Small performance hit (both policies evaluated).

**Fix:** Remove less specific policy, keep more comprehensive one.

**Priority:** 🟢 **Low** - Already much better than before

---

### 8. **Unused Indexes** (47 indexes)

**Problem:** Indexes created but never used.

**Impact:** Minimal - takes up space and slows writes slightly, but not urgent.

**Action:** Monitor for a few weeks, then remove if still unused.

**Priority:** 🟢 **Very Low** - Can ignore for now

**Note:** "Unused" just means not used yet - they may become useful as your queries evolve. Don't delete them immediately.

---

## 📋 **Recommended Action Order**

### **Today (Critical Performance):**
1. ✅ Run `FIX_REMAINING_RLS_POLICIES.sql` - **HUGE performance boost!**

### **This Week (Security):**
2. ✅ Run `FIX_SECURITY_ISSUES.sql` - Fix views and subscription_plans policy
3. ✅ Enable leaked password protection in Supabase Dashboard

### **Next Sprint (Security Hardening):**
4. ⚠️ Fix function search paths (13 functions)
5. ⚠️ Clean up remaining duplicate policies

### **Can Wait:**
6. 🟢 Unused indexes - monitor first
7. 🟢 PostGIS schema - low priority

---

## 🎯 **Expected Impact**

### After Fixing Remaining RLS Policies:
- **Listings queries:** Should be even faster (many more policies optimized)
- **Admin queries:** Faster
- **Org queries:** Faster
- **Overall:** Another 10-50x improvement on affected queries

### After All Fixes:
- **Security:** Much more secure
- **Performance:** Optimal
- **Maintainability:** Cleaner code

---

## 🚀 **Quick Start**

### Step 1: Fix Remaining RLS (CRITICAL!)
```sql
-- Run this in Supabase SQL Editor
-- File: supabase/sql/FIX_REMAINING_RLS_POLICIES.sql
```

### Step 2: Fix Security Issues
```sql
-- Run this in Supabase SQL Editor  
-- File: supabase/sql/FIX_SECURITY_ISSUES.sql
```

### Step 3: Enable Password Protection
1. Supabase Dashboard → Authentication → Password Settings
2. Enable "Leaked Password Protection"

---

## ✅ **Verification**

After running fixes, check Security Advisor again. You should see:
- ✅ All RLS policies optimized (no more auth_rls_initplan warnings)
- ✅ Security definer views fixed (or at least identified)
- ✅ subscription_plans has a policy

**The remaining warnings (function search paths, unused indexes) are lower priority and can be addressed later.**

---

**Bottom Line:** Fix the remaining RLS policies **TODAY** - it's a huge performance win! Everything else can wait. 🚀
