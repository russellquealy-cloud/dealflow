# Watchlist Bug Fix - Root Cause Analysis & Solution

## Problem Summary
- **Symptom**: Watchlist shows "No Saved Properties" even though 1 item exists in DB
- **Console logs show**: 
  - `requestedListingIds: Array(1)` 
  - `foundListingIds: Array(0)`
  - `missingListingIds: Array(1)`
- **Root cause**: Listings query returns 0 results, likely due to RLS blocking or listing not existing

## Root Cause Analysis

### 1. Watchlist Data Flow
**Schema relationship:**
- `watchlists` table: `property_id UUID REFERENCES listings(id)`
- **A watchlist item links to listings.id via watchlists.property_id**
- Query: `watchlists.property_id` → `listings.id` (should match)

**Current flow:**
1. `/api/watchlists` GET endpoint fetches watchlist rows
2. Extracts `property_id` values into `listingIds` array
3. Queries `listings` table with `.in('id', listingIds)`
4. Maps results back to watchlist items
5. If no listings found, `listing` is `null` and item gets filtered out

### 2. Potential Issues Found

**Issue 1: Column Name Mismatch**
- Query selects `bedrooms, bathrooms, home_sqft`
- Database may use `beds, baths, sqft`
- **FIXED**: Updated query to select both variants and sanitizeListing handles both

**Issue 2: RLS Policy**
- `listings_read_all` policy uses `USING (true)` - should allow all reads
- But if listing has status='draft' or 'archived', it might be filtered elsewhere
- **VERIFIED**: Watchlist query doesn't filter by status (intentional - users should see saved listings regardless)

**Issue 3: Listing Doesn't Exist**
- Property ID `939c12d5-534f-43d9-be9d-3a146b8cae55` may not exist in listings table
- Or was deleted after being added to watchlist
- **FIXED**: Added diagnostic endpoint and better error logging

**Issue 4: UI Filters Out Unavailable Items**
- Items without listings are completely filtered out
- User sees empty state even though watchlist item exists
- **FIXED**: UI now shows unavailable items with clear messaging

## Solution Implemented

### 1. Fixed Column Name Compatibility
- Updated `ListingSummary` type to include both `beds`/`bedrooms`, `baths`/`bathrooms`, `sqft`/`home_sqft`
- Updated query to select all variants
- Updated `sanitizeListing()` to handle both column names

### 2. Enhanced Error Logging
- Added detailed logging when listings query returns empty
- Added test query to verify if listing exists (for debugging)
- Logs RLS errors, missing listings, and ID mismatches

### 3. Improved UI
- **Before**: Items without listings were filtered out completely
- **After**: Items without listings are shown with "Unavailable" badge
- Users can see what they saved and remove unavailable items
- Clear messaging explains why items aren't available

### 4. Created Diagnostic Endpoint
- `/api/debug/watchlist` - Check watchlist and listing data
- Usage: `GET /api/debug/watchlist?watchlistId=xxx&propertyId=xxx`
- Helps verify data exists and RLS policies

## Files Changed

1. **`app/api/watchlists/route.ts`**
   - Updated query to select both column name variants (`beds`/`bedrooms`, etc.)
   - Added enhanced error logging for missing listings
   - Updated `sanitizeListing()` to handle both column names
   - Added diagnostic logging when listings query returns empty

2. **`app/watchlists/page.tsx`**
   - Updated UI to show unavailable items instead of filtering them out
   - Added "Unavailable Properties" section with remove buttons
   - Better empty state messaging

3. **`app/api/debug/watchlist/route.ts`** (NEW)
   - Diagnostic endpoint to verify watchlist and listing data
   - Check RLS policies and data existence

## Testing Instructions

### 1. Verify Watchlist Works
1. As an investor, save a listing to watchlist
2. Navigate to `/watchlists`
3. **Expected**: Listing appears as a card
4. **If not**: Check browser console for diagnostics

### 2. Test Unavailable Listing
1. Save a listing to watchlist
2. Delete that listing (or mark as archived)
3. Navigate to `/watchlists`
4. **Expected**: Shows "Unavailable Properties" section with the item
5. **Expected**: Can remove unavailable item from watchlist

### 3. Use Diagnostic Endpoint
```bash
# Check specific watchlist item
GET /api/debug/watchlist?watchlistId=5166b38d-9eb0-425d-8011-3409d27bcc18

# Check specific property
GET /api/debug/watchlist?propertyId=939c12d5-534f-43d9-be9d-3a146b8cae55

# Check all watchlist items for current user
GET /api/debug/watchlist
```

## Known Issues & Next Steps

1. **If listing still doesn't appear:**
   - Check diagnostic endpoint to verify listing exists
   - Check server logs for RLS errors (code `42501`)
   - Verify listing ID matches property_id in watchlist

2. **If RLS is blocking:**
   - Verify `listings_read_all` policy exists and uses `USING (true)`
   - Check if any other policies are conflicting
   - Ensure user is authenticated

3. **If listing doesn't exist:**
   - Listing may have been deleted
   - Property_id may be incorrect
   - Use diagnostic endpoint to verify

## Manual Verification Checklist

- [ ] Save a listing to watchlist
- [ ] Navigate to `/watchlists` - listing appears
- [ ] Delete a watchlisted listing
- [ ] Navigate to `/watchlists` - shows "Unavailable" section
- [ ] Remove unavailable item from watchlist
- [ ] Check diagnostic endpoint shows correct data
- [ ] No console errors in browser
- [ ] No API errors in server logs

