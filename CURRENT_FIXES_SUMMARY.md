# Current Fixes Summary - February 2025

## ✅ Fixed Issues

### 1. Listings Tiles Not Showing on Desktop (But Working on Mobile)
**Problem:** Listings appeared on map but not as tiles in list view on desktop web version.

**Root Cause:** The list container was using `mobileView` state to control visibility, which defaulted to `'map'`, causing the list to be hidden on desktop.

**Fix Applied:**
- Updated `app/components/ListingsSplitClient.tsx` to use CSS media queries instead of inline styles for desktop/mobile display
- On desktop (>=1024px), list is always visible via `display: block !important` in CSS
- On mobile, list respects the `mobileView` toggle
- Added proper className to list container for CSS targeting

**Files Changed:**
- `app/components/ListingsSplitClient.tsx`

**Testing:**
- [ ] Verify listings tiles appear on desktop (>=1024px width)
- [ ] Verify listings tiles still work on mobile with toggle
- [ ] Check that map and list show side-by-side on desktop

---

### 2. Search Bar Not Changing Map Location
**Problem:** Search autocomplete works but map doesn't recenter when searching for a location.

**Root Cause:** The geocode handler was missing `handleMapBoundsChange` in its dependency array, and the delay might have been too short.

**Fix Applied:**
- Added `handleMapBoundsChange` to useEffect dependencies
- Increased delay from 100ms to 300ms to ensure map has time to update
- Enhanced logging to track geocode → map update flow
- Ensured both `mapCenter` and `mapViewport` are set properly

**Files Changed:**
- `app/listings/page.tsx` - geocode handler dependencies and timing

**Testing:**
- [ ] Search for "Miami, FL" - map should recenter
- [ ] Search for "Tucson, AZ" - map should recenter
- [ ] List should update to show listings in searched area
- [ ] Check browser console for geocode success logs

---

### 3. Stripe Promo Codes
**Question:** Where do users enter promo codes?

**Answer:** Promo codes are now enabled in Stripe checkout. Users can enter them directly in the Stripe-hosted checkout page.

**Implementation:**
- Added `allow_promotion_codes: true` to checkout session creation
- Promo codes must be created in Stripe Dashboard → Products → Coupons
- Users will see a "Add promotion code" link/field in the Stripe checkout page

**Files Changed:**
- `app/api/billing/create-checkout-session/route.ts`

**How to Create Promo Codes:**
1. Go to Stripe Dashboard → Products → Coupons
2. Click "Create coupon"
3. Set discount (percentage or fixed amount)
4. Set duration (once, repeating, or forever)
4. Set redemption limits (optional)
5. Save the coupon
6. The coupon code can be used in checkout

**Testing:**
- [ ] Create a test coupon in Stripe Dashboard
- [ ] Start checkout flow
- [ ] Verify "Add promotion code" appears in Stripe checkout
- [ ] Enter promo code and verify discount applies

---

## 🔄 Still Need Testing

### Magic Link (A2)
- [ ] Request magic link on mobile device
- [ ] Click link in email
- [ ] Should be logged in and redirected (not stuck on login page)

### Password Reset (A3)
- [ ] Request password reset
- [ ] Click link in email (should have 1 hour validity)
- [ ] Set new password
- [ ] Should redirect to login with success message
- [ ] Log in with new password

---

## 📝 Notes

### Listings Display Fix
The fix ensures that on desktop (screens >= 1024px wide), the listings list is always visible alongside the map. On mobile, it still respects the toggle between map and list views.

### Search/Map Sync Fix
The geocode handler now properly waits for the map to update before triggering bounds changes. The 300ms delay ensures the map component has time to process the viewport/center changes.

### Stripe Promo Codes
Promo codes are handled entirely by Stripe's checkout page. No additional UI is needed in our app - Stripe provides the promo code input field automatically when `allow_promotion_codes: true` is set.

---

## 🚀 Next Steps

1. **Test listings display on desktop** - Verify tiles appear correctly
2. **Test search/map sync** - Verify map recenters on search
3. **Test magic link and password reset** - Complete end-to-end flows
4. **Create test promo code in Stripe** - Verify promo code field appears in checkout

---

**Last Updated:** February 2025

