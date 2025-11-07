# Test Accounts Guide

## Current Issue
The free wholesaler account (`wholesaler.free@test.com`) doesn't show the "Post a Deal" button.

## Root Cause
The "Post a Deal" button only appears when `userRole === 'wholesaler'`. The role is loaded from the profile's `segment` or `role` field in the database.

## Test Accounts to Check

### 1. Free Wholesaler Account
- **Email:** `wholesaler.free@test.com`
- **Expected Role:** `wholesaler`
- **Expected Tier:** `free`
- **Can Post:** Yes (2 listings limit)
- **Issue:** Profile may not have `segment` or `role` set to `'wholesaler'`

### 2. Pro Wholesaler Account
- **Email:** Check database for `*wholesaler*@test.com` or `*wholesaler*@offaxisdeals.com`
- **Expected Role:** `wholesaler`
- **Expected Tier:** `pro` or `basic`
- **Can Post:** Yes (10-30 listings depending on tier)

### 3. Investor Account
- **Email:** Check database for `*investor*@test.com`
- **Expected Role:** `investor`
- **Expected Tier:** Various
- **Can Post:** No (investors cannot post)

## How to Fix the Free Wholesaler Account

### Option 1: Update Profile in Supabase Dashboard
1. Go to Supabase Dashboard → Table Editor → `profiles`
2. Find the profile for `wholesaler.free@test.com`
3. Update the `segment` field to `'wholesaler'`
4. Ensure `tier` is set to `'free'`

### Option 2: Update via SQL
```sql
UPDATE profiles 
SET segment = 'wholesaler', 
    role = 'wholesaler', 
    tier = 'free'
WHERE id = (SELECT id FROM auth.users WHERE email = 'wholesaler.free@test.com');
```

### Option 3: Check Browser Console
Open browser console and look for:
```
Loaded user role: [role] Profile: { segment: ..., role: ..., email: ... }
```

This will show what role is being detected.

## Finding Other Test Accounts

To find all test accounts in the database:

```sql
SELECT 
  u.email,
  p.segment,
  p.role,
  p.tier,
  p.created_at
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email LIKE '%@test.com' 
   OR u.email LIKE '%@offaxisdeals.com'
ORDER BY u.created_at DESC;
```

## Testing Steps

1. **Sign in as free wholesaler**
   - Check browser console for role logs
   - Verify "Post a Deal" button appears
   - Try to post a listing

2. **Sign in as pro wholesaler**
   - Verify "Post a Deal" button appears
   - Check if additional features are available

3. **Sign in as investor**
   - Verify "Post a Deal" button does NOT appear
   - Verify investor-specific features (Watchlist, Saved Searches) appear

## Code Locations

- **Header Component:** `app/components/Header.tsx` (line 238)
- **Post Deal Button:** `app/components/PostDealButton.tsx`
- **New Listing Page:** `app/my-listings/new/page.tsx`
- **Tier Policy:** `lib/tierPolicy.ts` (free wholesalers can post 2 listings)

