# How to Check Tucson Listing in Supabase

## Option 1: Use the Debug API Endpoint (Recommended)

1. **Make sure you're logged in as an admin**
2. **Visit:** `https://offaxisdeals.com/api/debug/listings`
   - Or locally: `http://localhost:3000/api/debug/listings`
3. **The response will show:**
   - Total listings count
   - Listings with coordinates
   - **Tucson listings** (count and details)
   - Miami listings (for comparison)
   - What the API query would return

**Example Response:**
```json
{
  "tucson": {
    "count": 1,
    "listings": [
      {
        "id": "...",
        "title": "...",
        "city": "Tucson",
        "state": "AZ",
        "status": "live",
        "latitude": 32.2226,
        "longitude": -110.9747,
        "owner_id": "...",
        "created_at": "..."
      }
    ]
  }
}
```

## Option 2: Check Directly in Supabase Dashboard

1. **Go to:** [Supabase Dashboard](https://supabase.com/dashboard)
2. **Navigate to:** Your project → **Table Editor** → **listings**
3. **Filter by:**
   - `city` = `Tucson`
   - `state` = `AZ`
4. **Check these fields:**
   - `latitude` - Should NOT be null
   - `longitude` - Should NOT be null
   - `status` - Should be `null`, `'live'`, `'active'`, or `'published'` (NOT `'draft'` or `'archived'`)
   - `archived` - Should be `false` or `null`

## Common Issues

### Listing Not Showing on Map/List

**Check:**
1. ✅ Listing has `latitude` and `longitude` set
2. ✅ Listing `status` is NOT `'draft'` or `'archived'`
3. ✅ Listing is within current map bounds
4. ✅ RLS policies allow viewing (check as the listing owner)

### Listing Shows in "My Listings" But Not Public

**Possible Causes:**
- Listing `status` is `'draft'` (only owner can see drafts)
- Listing is `archived`
- Listing doesn't have coordinates
- RLS policy is blocking public view

### Fix Missing Coordinates

If the listing exists but has no coordinates:
1. Go to the listing detail page (if accessible)
2. Edit the listing
3. Use the map picker to set latitude/longitude
4. Save the listing

---

**Last Updated:** November 2025

