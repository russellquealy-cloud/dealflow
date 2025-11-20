# Quick Test Matrix - November 19, 2025 Build
**Build Focus:** Magic Link Auth, Password Reset, Watchlist Display, Geocode API

---

## 🔴 CRITICAL - Must Test First

### 1. Magic Link Authentication
**Status:** Code fixed, needs verification  
**Time:** 5 minutes

**Steps:**
1. Go to `/login`
2. Select "Magic Link" tab
3. Enter your email address
4. Click "Send Magic Link"
5. **Expected:** Success message "Check your email for the sign-in link"
6. Check your email inbox
7. **Expected:** Email received with magic link
8. Click the magic link in email
9. **Expected:** 
   - Redirects to `/auth/callback` then to `/listings` (or intended page)
   - You are automatically signed in
   - No "Login failed" errors
   - Session persists (refresh page, still logged in)

**Check Browser Console:**
- Look for: `✅ Auth callback: Code exchange successful`
- Look for: `✅ AuthProvider: User signed in`
- **No errors** about session or cookies

**If Fails:**
- Check Supabase Auth → URL Configuration includes:
  - `https://offaxisdeals.com/auth/callback`
  - `https://www.offaxisdeals.com/auth/callback`
- Check browser console for specific error messages
- Verify cookies are being set (Application → Cookies in DevTools)

---

### 2. Password Reset Flow
**Status:** Code fixed, needs verification  
**Time:** 5 minutes

**Steps:**
1. Go to `/login`
2. Enter your email
3. Click "Forgot password?"
4. **Expected:** Success message "Check your email for a password reset link"
5. Check your email inbox
6. **Expected:** Email received with reset link
7. Click the reset link in email
8. **Expected:**
   - Redirects to `/reset-password`
   - Page shows "Reset link validated" message
   - Form is enabled (not disabled)
9. Enter new password (min 8 characters)
10. Confirm password
11. Click "Update Password"
12. **Expected:**
    - Success message "Your password has been updated successfully"
    - Auto-redirects to `/login` after 2 seconds
    - Login page shows "Password updated successfully" message
13. Log in with new password
14. **Expected:** Login succeeds

**Check Browser Console:**
- Look for: `✅ Password reset: Token detected in URL hash`
- Look for: `✅ Password reset: Password updated successfully`
- **No errors** about invalid/expired token

**If Fails:**
- Check Supabase Auth → URL Configuration includes:
  - `https://offaxisdeals.com/reset-password`
  - `https://www.offaxisdeals.com/reset-password`
- If token validation fails immediately, check browser console for hash fragment errors
- Verify reset link hasn't expired (1 hour validity)

---

### 3. Watchlist Display
**Status:** Code fixed, needs verification  
**Time:** 5 minutes

**Steps:**
1. Go to `/listings`
2. Find a listing (or use existing one)
3. Click "Add to Watchlist" (or similar button)
4. **Expected:** Success message or visual confirmation
5. Navigate to `/watchlists`
6. **Expected:**
   - Page loads without errors
   - Your saved listing appears as a card/tile
   - Listing shows: address, price, image (if available)
   - No "No Saved Properties" message (if you added one)
7. Click "Remove" button on a watchlist item
8. **Expected:**
   - Item disappears immediately
   - List updates without page refresh

**Check Browser Console:**
- Look for: `✅ Watchlist: Watchlists loaded` with count > 0
- Look for: `📋 Watchlist item 0:` with `hasListings: true`
- **No errors** about API or data mapping

**If Fails:**
- Check Network tab → `/api/watchlists` response
- Verify response has `watchlists` array with `listings` property (plural)
- Check browser console for data mapping errors
- Verify RLS policies allow access to saved listings

---

### 4. Search & Geocode (If API Key Configured)
**Status:** Code fixed, API key needs configuration  
**Time:** 3 minutes

**Prerequisites:**
- `GOOGLE_GEOCODE_API_KEY` must be set in Vercel
- Required APIs enabled in Google Cloud Console

**Steps:**
1. Go to `/listings`
2. Enter a location in search bar (e.g., "Miami, FL")
3. Click search or press Enter
4. **Expected:**
   - Map recenters to Miami, FL
   - Listings update to show properties in that area
   - No 400/404 errors in console
5. Try another location (e.g., "Tucson, AZ")
6. **Expected:** Map recenters again, listings update

**Check Browser Console:**
- Look for: `GEOCODE: Using GOOGLE_GEOCODE_API_KEY`
- **No errors** about "Geocoding service denied request"
- **No 400/404** errors from `/api/geocode`

**If Fails:**
- Check Vercel environment variables for `GOOGLE_GEOCODE_API_KEY`
- Verify API key is valid in Google Cloud Console
- Enable required APIs: Geocoding API, Places API, Places Details API
- Check API key restrictions (should allow server-side calls)

---

## 🟠 HIGH PRIORITY - Test After Critical

### 5. General Authentication
**Time:** 3 minutes

**Steps:**
1. Log out (if logged in)
2. Go to `/login`
3. Enter email and password
4. Click "Sign In"
5. **Expected:** Redirects to `/listings`, session persists
6. Refresh page
7. **Expected:** Still logged in
8. Navigate to protected pages (`/account`, `/my-listings`)
9. **Expected:** All accessible without redirect to login

---

### 6. Cookie & Session Persistence
**Time:** 2 minutes

**Steps:**
1. Log in
2. Open DevTools → Application → Cookies
3. **Expected:** See Supabase auth cookies set
4. Check cookie properties:
   - `SameSite: Lax` (or `Strict`)
   - `Secure: true` (on HTTPS)
   - `Domain: .offaxisdeals.com` (or appropriate domain)
5. Close browser tab
6. Reopen and go to `/listings`
7. **Expected:** Still logged in (session persisted)

---

### 7. Error Handling
**Time:** 3 minutes

**Test Cases:**
1. **Magic Link - Invalid Email:**
   - Enter invalid email (e.g., "notanemail")
   - **Expected:** User-friendly error message

2. **Password Reset - Weak Password:**
   - Request reset, click link
   - Enter password < 8 characters
   - **Expected:** Error about password strength

3. **Watchlist - Empty State:**
   - Remove all watchlist items
   - Go to `/watchlists`
   - **Expected:** "No Saved Properties" message with "Browse Listings" button

---

## 🟡 NICE TO HAVE - Quick Checks

### 8. Mobile Responsiveness
**Time:** 2 minutes

**Steps:**
1. Open DevTools → Toggle device toolbar
2. Select iPhone or Android device
3. Test magic link flow on mobile viewport
4. **Expected:** Forms are readable, buttons are tappable (44px+)
5. Test watchlist page
6. **Expected:** Cards stack properly, no horizontal scroll

---

### 9. Admin Email Diagnostics
**Time:** 2 minutes

**Prerequisites:** Must be logged in as admin

**Steps:**
1. Go to `/admin`
2. Find "Send Test Email" button
3. Click it
4. **Expected:** Success message
5. Check email inbox
6. **Expected:** Test emails received (magic link + password reset)

---

## ✅ Success Criteria

**Build is Ready if:**
- ✅ Magic link signs user in automatically
- ✅ Password reset works end-to-end
- ✅ Watchlist displays saved properties
- ✅ Search works (if API key configured)
- ✅ No console errors in critical flows
- ✅ Sessions persist across page refreshes

**Build Needs Fixes if:**
- ❌ Magic link doesn't sign user in
- ❌ Password reset shows "invalid token" immediately
- ❌ Watchlist shows "No Saved Properties" when items exist
- ❌ Search returns 400/404 errors (API key issue)
- ❌ Console shows session/cookie errors

---

## 📝 Quick Notes

**If Magic Link Fails:**
- Check Supabase Auth → URL Configuration
- Verify `/auth/callback` route is accessible
- Check browser console for specific errors

**If Password Reset Fails:**
- Check token is in URL hash (`#access_token=...`)
- Verify Supabase Auth → URL Configuration
- Check reset link hasn't expired

**If Watchlist Fails:**
- Check Network tab → API response structure
- Verify `listings` (plural) property exists
- Check RLS policies

**If Search Fails:**
- Verify `GOOGLE_GEOCODE_API_KEY` in Vercel
- Check Google Cloud Console for API enablement
- Verify API key restrictions allow server-side calls

---

**Last Updated:** November 19, 2025  
**Estimated Total Test Time:** 20-30 minutes

