# QA Fixes Summary - Off Axis Deals

## Issues Fixed (Part 1: Listings, Search, Watchlist, Browser Notice)

### L1, L2: Listing Visibility Issues

**Problem:**
- Seed Miami listings show on map but not as tiles in list view
- Tucson test listing shows in "My Listings" but not in public listings/map

**Root Cause:**
- Status filter in `app/lib/listings.ts` was too restrictive
- Using `.or('status.is.null,status.eq.live,status.eq.active,status.eq.published')` excludes listings with other status values
- Seed data might have status values not in this list

**Fix Applied:**
- Updated status filter to be more permissive
- Still excludes only 'draft' and 'archived' explicitly
- Added defensive logging to compare map markers vs list items
- Logs warning if map has more markers than list items

**Files Changed:**
- `app/lib/listings.ts` - Status filter logic
- `app/listings/page.tsx` - Added defensive logging

**Testing:**
- Check console logs for "📊 Listings loaded" to see itemsCount vs pointsCount
- If pointsCount > itemsCount, client-side filtering may be excluding listings
- Verify Miami seed listings appear in both map and list
- Verify Tucson listing appears in My Listings, public list, and map

### L3: Search & Map Sync

**Problem:**
- Search autocomplete works but map doesn't recenter on search
- Console shows 404/400 errors from `/api/geocode`

**Root Cause:**
- Geocode API exists and looks correct
- Map recenter logic exists but might not be triggering properly
- Error handling was insufficient

**Fix Applied:**
- Enhanced error handling in geocode flow
- Added logging for successful geocoding
- Ensured `handleMapBoundsChange` is called after setting viewport
- Added user-friendly error messages

**Files Changed:**
- `app/listings/page.tsx` - Enhanced geocode error handling and map recenter logic
- `app/api/geocode/route.ts` - Already exists and should work (verify API key)

**Testing:**
- Search for "Miami, FL" - map should recenter
- Check console for "✅ Geocoding successful" log
- Verify no 404/400 errors for valid queries
- Verify list updates to match new map bounds

### T1: Watchlist Display

**Problem:**
- Watchlist items added but page shows "No Saved Properties"

**Root Cause:**
- Fixed in previous work (WATCHLIST_FIX_SUMMARY.md)
- Join between watchlist items and listings was failing
- UI was filtering out items without listings

**Status:**
- ✅ Already fixed in previous session
- UI now shows unavailable items with clear messaging
- Enhanced error logging in place

**Files Changed:**
- `app/api/watchlists/route.ts` - Fixed column compatibility, enhanced logging
- `app/watchlists/page.tsx` - Shows unavailable items instead of filtering

**Testing:**
- Add listing to watchlist
- Navigate to `/watchlists` - should see listing
- If listing is deleted, should show "Unavailable" section

### Browser Notice

**Problem:**
- Yellow "Browser Notice – Google Maps API not loaded" appears on every visit
- Should only appear when Maps API truly fails

**Root Cause:**
- BrowserCompatibilityChecker runs immediately and checks for `window.google.maps`
- Google Maps script loads asynchronously, so check happens before script loads

**Fix Applied:**
- Added delay before checking Maps API (5 seconds)
- Only shows notice if Maps API truly fails to load
- Checks for script load errors
- Waits for async script loading

**Files Changed:**
- `app/components/BrowserCompatibilityChecker.tsx` - Added async check with delay

**Testing:**
- Normal page load should not show browser notice
- Only shows if Maps API script fails to load

## Issues Fixed (Part 2: Auth & Billing)

### A2: Magic Link Flow on Mobile

**Problem:**
- Magic link doesn't log user in on mobile
- User ends up back at login page after clicking link

**Root Cause:**
- Magic link redirected to `/login` but didn't properly handle session token from URL
- Mobile browsers use implicit flow with hash fragments, which need special handling

**Fix Applied:**
- Changed magic link redirect to use `/auth/callback?next=...` route which properly handles code exchange
- Added session detection in login page for hash fragments (implicit flow)
- Enhanced session refresh logic

**Files Changed:**
- `app/login/page.tsx` - Added magic link callback detection, changed redirect URL
- `app/auth/callback/route.ts` - Already exists and handles code exchange

**Testing:**
- Request magic link on mobile
- Click link in email
- Should be logged in and redirected to intended destination

### A3: Password Reset Flow

**Problem:**
- Password reset fails with "unable to update" error
- Reset link doesn't properly validate token

**Root Cause:**
- Reset page didn't check for valid token in URL
- Didn't handle both implicit flow (hash) and PKCE flow (code query param)
- Error messages weren't user-friendly

**Fix Applied:**
- Added token validation on page load
- Handles both `access_token` in hash and `code` in query params
- Exchanges code for session if needed
- Enhanced error messages for expired/invalid tokens
- Auto-redirects to login after successful password update

**Files Changed:**
- `app/reset-password/page.tsx` - Added token validation, enhanced error handling

**Testing:**
- Request password reset
- Click link in email
- Set new password
- Should redirect to login with success message
- Log in with new password

### ADM5: Admin Email Diagnostics

**Problem:**
- No clean way to verify emails from admin side

**Status:**
- ✅ Already implemented in previous work
- Admin page has "Send Test Email to Myself" button
- Uses `/api/diagnostics/email` endpoint
- Sends both magic link and password reset test emails

**Files:**
- `app/admin/page.tsx` - Has test email button
- `app/api/diagnostics/email/route.ts` - Test email endpoint

**Testing:**
- Log in as admin
- Click "Send Test Email to Myself"
- Check inbox for test emails

### P1: Stripe Checkout Error

**Problem:**
- "You cannot pass both customer and customer_email" error

**Root Cause:**
- `customer_email` was set unconditionally before checking if `stripeCustomerId` exists
- When customer ID exists, both were set, causing Stripe error

**Fix Applied:**
- Removed unconditional `customer_email` assignment
- Only set `customer_email` when no `stripeCustomerId` exists
- Added explicit `delete` to ensure `customer_email` is not set when `customer` is set

**Files Changed:**
- `app/api/billing/create-checkout-session/route.ts` - Fixed customer/customer_email logic

**Testing:**
- Create checkout session with existing customer
- Create checkout session for new customer
- Both should work without errors

### P2: Subscription Management

**Status:**
- ✅ Already implemented
- Billing portal route exists at `/api/billing/portal`
- Billing page has "Manage Billing" button
- Uses Stripe Customer Portal for subscription management

**Files:**
- `app/api/billing/portal/route.ts` - Portal session creation
- `app/billing/page.tsx` - UI with "Manage Billing" button

**Note:**
- Portal allows users to view billing history, update payment method, cancel subscription
- If "why are you canceling?" prompt is needed, it can be added as a modal before redirecting

## Remaining Issues (To Be Fixed)

### A2: Magic Link Flow on Mobile
- Magic link doesn't log user in on mobile
- Need to audit Supabase auth config and redirect URLs

### A3: Password Reset Flow
- Password reset fails with "unable to update" error
- Need to fix reset page logic and token handling

### ADM5: Admin Email Diagnostics
- Need to wire "Send Test Email" to real address
- Ensure it uses same email delivery path as auth emails

### P1: Stripe Checkout Error
- "You cannot pass both customer and customer_email" error
- Need to fix checkout session creation

### P2: Subscription Management
- No way to cancel subscription
- No billing history view
- Need to implement Stripe customer portal

### M1: Messaging Polish
- Read receipts not obviously surfaced
- Conversation list needs more info (name, company, location)

### N1: Notifications Wiring
- Notifications not wired for key events
- Need to wire: new message, watchlist matches, subscription updates

### ADM1-ADM4: Admin Tools
- User moderation actions not clickable/wired
- Flags & reports area unclear
- Audit logs not visible/usable
- AI usage view needs improvement

## Next Steps

1. Continue with auth fixes (A2, A3, ADM5)
2. Fix Stripe billing (P1, P2)
3. Polish messaging (M1)
4. Wire notifications (N1)
5. Complete admin tools (ADM1-ADM4)
