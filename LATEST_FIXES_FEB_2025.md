# Latest Fixes - February 2025

## ✅ Fixed Issues

### 1. Geocode Error (400) - "Could not find location: Miami"
**Problem:** Searching for "Miami" returned a 400 error from the geocode API.

**Root Cause:** 
- Places Text Search API error handling was too strict
- Error messages weren't user-friendly
- Fallback to Geocoding API wasn't working properly for ambiguous queries

**Fix Applied:**
- Improved error handling in `app/api/geocode/route.ts`
- Better fallback logic between Places Text Search and Geocoding API
- More specific error messages (e.g., "Please try a more specific location (e.g., 'Miami, FL' instead of 'Miami')")
- Better logging for debugging

**Files Changed:**
- `app/api/geocode/route.ts`

**Testing:**
- [ ] Search for "Miami" - should work or suggest "Miami, FL"
- [ ] Search for "Miami, FL" - should work correctly
- [ ] Search for "Tucson, AZ" - should work correctly
- [ ] Check browser console for improved error messages

---

### 2. Magic Link Not Signing In
**Problem:** Magic link email was sent correctly but clicking it didn't sign the user in.

**Root Cause:**
- `/auth/callback` route only handled PKCE flow (code parameter)
- Didn't handle implicit flow (hash fragments with access_token)
- Didn't check for existing sessions
- Redirect didn't preserve the intended destination

**Fix Applied:**
- Enhanced `app/auth/callback/route.ts` to handle both PKCE and implicit flows
- Added session check for implicit flow
- Improved error handling and logging
- Updated `app/login/page.tsx` to include `next` parameter in redirect URL

**Files Changed:**
- `app/auth/callback/route.ts`
- `app/login/page.tsx`

**Testing:**
- [ ] Request magic link
- [ ] Click link in email
- [ ] Should be logged in and redirected to intended page (not stuck on login)
- [ ] Check browser console for auth callback logs

---

### 3. Password Reset Still Showing Errors
**Problem:** Password reset page immediately showed "Invalid or expired reset link" even with fresh links.

**Root Cause:**
- Token validation was too strict
- Didn't allow form submission when token validation was in progress
- Multiple error messages displayed simultaneously

**Fix Applied:**
- Made token validation more forgiving in `app/reset-password/page.tsx`
- Allow form submission even if validation is in progress (let `updateUser` be the final validator)
- Added success state indicator when token is validated
- Improved error message display (no duplicates)

**Files Changed:**
- `app/reset-password/page.tsx`

**Testing:**
- [ ] Request password reset
- [ ] Click link in email (should have 1 hour validity)
- [ ] Should see "Validating reset link..." then "Reset link validated"
- [ ] Should be able to enter new password
- [ ] Should redirect to login with success message after password update

---

### 4. Tucson Listing Not Showing
**Status:** Needs investigation

**Possible Causes:**
- Listing might not have coordinates (latitude/longitude)
- Listing status might be 'draft' or 'archived'
- Listing might be outside current map bounds
- RLS policies might be blocking it

**Debug Steps:**
1. Run `/api/debug/listings` (admin only) to check if Tucson listing exists
2. Verify listing has `latitude` and `longitude` set
3. Check listing `status` (should be `null`, `'live'`, `'active'`, or `'published'`)
4. Verify listing is not `archived`
5. Check if listing appears in "My Listings" for the wholesaler

**Files to Check:**
- `app/api/debug/listings/route.ts` - Diagnostic endpoint
- `app/lib/listings.ts` - Status filter logic

---

### 5. Stripe Promo Codes
**Status:** Enabled, needs test codes created

**Implementation:**
- Added `allow_promotion_codes: true` to checkout session
- Created documentation: `docs/STRIPE_PROMO_CODES.md`

**Next Steps:**
1. Follow instructions in `docs/STRIPE_PROMO_CODES.md`
2. Create 4 test promo codes:
   - `TEST10` - 10% off Investor Basic Monthly
   - `TEST20` - 20% off Investor Pro Yearly
   - `TEST15` - 15% off Wholesaler Basic Monthly
   - `TEST25` - 25% off Wholesaler Pro Yearly
3. Test in checkout flow
4. Delete test codes after verification

**Files Changed:**
- `app/api/billing/create-checkout-session/route.ts`
- `docs/STRIPE_PROMO_CODES.md` (new)

---

## 🔄 Testing Checklist

### Geocode
- [ ] Search "Miami" - should work or suggest "Miami, FL"
- [ ] Search "Miami, FL" - should recenter map
- [ ] Search "Tucson, AZ" - should recenter map
- [ ] No 400 errors in console

### Magic Link
- [ ] Request magic link
- [ ] Click link in email
- [ ] Should be logged in automatically
- [ ] Should redirect to intended page

### Password Reset
- [ ] Request password reset
- [ ] Click link in email
- [ ] Should see validation message, not immediate error
- [ ] Should be able to set new password
- [ ] Should redirect to login with success message

### Tucson Listing
- [ ] Check `/api/debug/listings` for Tucson listing
- [ ] Verify listing has coordinates
- [ ] Verify listing status
- [ ] Check if it appears in "My Listings"
- [ ] Check if it appears on public listings page when in bounds

### Promo Codes
- [ ] Create test promo codes in Stripe
- [ ] Start checkout flow
- [ ] Verify "Add promotion code" appears
- [ ] Enter test code
- [ ] Verify discount applies
- [ ] Complete checkout
- [ ] Delete test codes

---

## 📝 Notes

### Geocode Improvements
The geocode API now provides better error messages and handles ambiguous queries better. If a query like "Miami" fails, it suggests using "Miami, FL" instead.

### Magic Link Flow
The callback route now handles both PKCE (code) and implicit (hash) flows, making it more reliable across different devices and browsers.

### Password Reset
The token validation is now more forgiving, allowing the form to be submitted even if validation is still in progress. The final validation happens when `updateUser` is called, which is more reliable.

### Promo Codes
Promo codes are fully enabled. Users will see an "Add promotion code" field in the Stripe checkout page. Codes must be created in Stripe Dashboard.

---

**Last Updated:** February 2025

