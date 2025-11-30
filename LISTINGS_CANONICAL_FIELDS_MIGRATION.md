# Listings Canonical Fields Migration

## Overview

This migration standardizes the listings table to use canonical field names and ensures all listings automatically get geocoded coordinates.

## Changes Completed

### 1. ✅ Updated Types (`lib/listings.ts`)
- **ListingRow interface**: Updated to use only canonical fields:
  - `beds` (removed `bedrooms`)
  - `baths` (removed `bathrooms`)
  - `sqft` (removed `home_sqft`)
  - `lot_sqft` (removed `lot_size`, `lot_unit`)
  - `garage_spaces` (removed `garage`)
- Added: `property_type`, `age_restricted`, `views`, `geom`, `updated_at`

### 2. ✅ Updated Geocoding Helper (`lib/geocoding.ts`)
- Added overload to accept address components: `geocodeAddress(address, city?, state?, zip?)`
- Still supports full address string for backward compatibility
- Uses `GOOGLE_GEOCODE_API_KEY` or `GOOGLE_MAPS_SERVER_API_KEY`

### 3. ✅ Updated API Routes

#### POST `/api/listings` (`app/api/listings/route.ts`)
- Accepts both canonical and legacy fields (during transition)
- Converts legacy → canonical automatically
- Server-side geocoding using address components
- Updates `geom` via RPC function (if available)
- Returns error if geocoding fails

#### PATCH `/api/listings/[id]` (`app/api/listings/[id]/route.ts`) - NEW
- Update listing with automatic geocoding if address changes
- Converts legacy → canonical fields
- Updates `geom` when coordinates change
- Validates ownership before updating

### 4. ✅ Created Migration SQL (`supabase/migrations/migrate_listings_to_canonical_fields.sql`)
- Phase 1: Copies data from legacy → canonical fields using COALESCE
- Includes verification queries
- Phase 2: Commented DROP statements (run after verification)
- Optional: PostGIS trigger/function for automatic geom updates

## Remaining Work

### High Priority

1. **Update Post a Deal Form** (`app/post/page.tsx`)
   - ✅ FormState type updated to canonical fields
   - ⚠️ Form submission still uses legacy fields - needs update
   - ⚠️ Form inputs still reference legacy field names - needs update
   - Should call `/api/listings` POST instead of direct Supabase insert

2. **Update My Listings Edit** (`app/my-listings/page.tsx`)
   - Update `handleSave` to use `/api/listings/[id]` PATCH
   - Update form fields to use canonical field names
   - Remove client-side geocoding (now handled server-side)

3. **Update CreateListingForm** (`app/components/CreateListingForm.tsx`)
   - Already uses canonical fields (`beds`, `baths`, `sqft`)
   - Verify it calls `/api/listings` POST (not direct Supabase insert)
   - Add `lot_sqft` and `garage_spaces` fields if missing

### Medium Priority

4. **Update Display Components**
   - `app/components/ListingCard.tsx` - Already updated to use `lot_sqft`
   - `app/listings/page.tsx` - Update `Row` interface to remove legacy fields
   - `app/listings/client-page.tsx` - Update `ListingData` interface

5. **Update Other Usages**
   - Search for all remaining `bedrooms`, `bathrooms`, `home_sqft`, `lot_size`, `garage` references
   - Replace with canonical equivalents where appropriate
   - Remove legacy field references in display-only code

### Low Priority

6. **Database Triggers/Functions**
   - Create PostGIS trigger to auto-update `geom` when `latitude`/`longitude` change
   - Or create RPC function `update_listing_geom(listing_id, lng, lat)`
   - See migration SQL for examples

7. **Backfill Existing Listings**
   - Update `app/api/listings/backfill-geo/route.ts` if it exists
   - Ensure it uses canonical fields

## Canonical Field Mapping

| Legacy Field | Canonical Field | Notes |
|-------------|----------------|-------|
| `bedrooms` | `beds` | Integer |
| `bathrooms` | `baths` | Numeric (supports half baths) |
| `home_sqft` | `sqft` | Integer (square feet) |
| `lot_size` | `lot_sqft` | Numeric (square feet) |
| `lot_unit` | *(removed)* | Always sqft now |
| `garage` | `garage_spaces` | Integer (was boolean/number) |

## Testing Checklist

- [ ] Create new listing via Post a Deal
- [ ] Verify `latitude`, `longitude`, `geom` are populated
- [ ] Verify canonical fields are saved correctly
- [ ] Edit listing and change address
- [ ] Verify coordinates update automatically
- [ ] Verify map shows listing in correct location
- [ ] Test filters still work (beds, baths, sqft, price)
- [ ] Run migration SQL Phase 1
- [ ] Verify data copied correctly
- [ ] Deploy updated code
- [ ] Verify production works correctly
- [ ] Run migration SQL Phase 2 (DROP legacy columns)

## Environment Variables

Ensure these are set in Vercel:
- `GOOGLE_GEOCODE_API_KEY` (preferred) or `GOOGLE_MAPS_SERVER_API_KEY`

## Notes

- The API routes accept both legacy and canonical fields during transition
- Legacy fields are automatically converted to canonical
- After migration, code should use only canonical fields
- Geocoding is now server-side only (more secure, consistent)
- All new/updated listings will have coordinates populated automatically

