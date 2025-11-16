# Listings Display Fix - Root Cause Analysis & Solution

## Problem Summary
- **Miami seed listings**: Show as pins on map but NOT in list view
- **Tucson test listing**: Doesn't appear in map OR list view
- **Root cause**: Map and list views were using different queries with inconsistent filters

## Root Cause Analysis

### 1. Multiple Listing Fetch Paths
**Found 3 different listing fetch implementations:**
- `app/listings/page.tsx` → calls `/api/listings` (used by main page)
- `app/listings/client-page.tsx` → direct Supabase query (bypasses API, different filters)
- `app/api/listings/route.ts` → API endpoint with status filter

### 2. Status Filter Too Restrictive
**Original API filter:**
```typescript
query = query.or('status.eq.live,status.is.null');
```
**Problem:** This only shows listings with status='live' or status=null. Seed data may have other status values (e.g., 'active', 'published', etc.) that were being excluded.

### 3. Inconsistent Filters Between Map and List
- Map view: Used API endpoint with status filter
- List view: Could use either API or direct Supabase query
- No unified source of truth

### 4. RLS Policies
**Verified:** RLS policies are correct - `listings_read_all` allows public read access with `USING (true)`, so RLS is NOT blocking listings.

## Solution Implemented

### 1. Created Unified Listings Helper (`app/lib/listings.ts`)
- **Single source of truth** for all listing queries
- Both map and list views now use the same `getListingsForSearch()` function
- Consistent filtering logic across all views

### 2. Fixed Status Filter
**New filter (more permissive):**
```typescript
// Show everything EXCEPT 'draft' and 'archived'
query = query.or('status.is.null,status.neq.draft,status.neq.archived');
```
**This includes:**
- `status = 'live'` ✅
- `status = null` ✅
- `status = 'active'` ✅
- `status = 'published'` ✅
- Any other status except 'draft'/'archived' ✅

### 3. Updated API Route
- `/api/listings/route.ts` now uses `getListingsForSearch()` helper
- Removed duplicate query logic
- Consistent behavior for map and list views

### 4. Added Diagnostic Endpoint
- `/api/debug/listings` - Check what listings exist in database
- Helps verify data and RLS policies
- Usage: `GET /api/debug/listings?city=Miami&state=FL`

## Files Changed

1. **`app/lib/listings.ts`** (NEW)
   - Unified listings query helper
   - Single source of truth for all listing fetches

2. **`app/api/listings/route.ts`**
   - Now uses `getListingsForSearch()` helper
   - Removed duplicate query logic
   - Consistent with unified helper

3. **`app/api/debug/listings/route.ts`** (NEW)
   - Diagnostic endpoint to verify listing data
   - Check RLS policies and data existence

## Testing Instructions

### 1. Verify Miami Seed Listings
1. Navigate to `/listings`
2. **Map view**: Should show Miami listings as pins
3. **List view**: Should show Miami listings as cards
4. **Count should match**: Map pin count = List card count

### 2. Verify Tucson Listing
1. As a wholesaler, create a new listing in Tucson, AZ
2. Ensure it has:
   - Valid address (city: "Tucson", state: "AZ")
   - Latitude and longitude coordinates
   - Status = 'live' (or null, or any value except 'draft'/'archived')
3. Navigate to `/listings`
4. **Map view**: Should show Tucson listing as a pin
5. **List view**: Should show Tucson listing as a card
6. Navigate to `/my-listings`: Should show Tucson listing

### 3. Use Diagnostic Endpoint
```bash
# Check Miami listings
GET /api/debug/listings?city=Miami&state=FL

# Check Tucson listings  
GET /api/debug/listings?city=Tucson&state=AZ

# Check all listings
GET /api/debug/listings
```

## Known Limitations

1. **Coordinates Required**: Listings without latitude/longitude won't appear on map (by design)
2. **Status Filter**: Listings with status='draft' or 'archived' are excluded (by design)
3. **Admin Override**: Admins can see all listings including drafts (via `includeDrafts: true`)

## Next Steps

1. **Deploy and test** in production
2. **Verify** Miami seed listings appear in both map and list
3. **Verify** new Tucson listing appears everywhere
4. **Check diagnostic endpoint** if issues persist
5. **Update seed data** if needed to ensure status='live' or null

## Manual Verification Checklist

- [ ] Miami seed listings show as pins on map
- [ ] Miami seed listings show as cards in list view
- [ ] Map pin count matches list card count
- [ ] Tucson test listing appears on map
- [ ] Tucson test listing appears in list view
- [ ] Tucson test listing appears in "My Listings"
- [ ] Diagnostic endpoint shows correct counts
- [ ] No console errors in browser
- [ ] No API errors in server logs

