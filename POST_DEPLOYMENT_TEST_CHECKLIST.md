# Post-Deployment Test Checklist - November 19, 2025

## 🎯 What to Test After Deployment

After deploying the latest fixes, test these critical features in order:

---

## 1. ✅ Magic Link Authentication (CRITICAL)

**What Changed:** Fixed PKCE flow mismatch - client now uses `flowType: 'pkce'` to match Supabase

**How to Test:**
1. Go to `/login`
2. Enter your email address
3. Click "Send Magic Link" (NOT password login)
4. Check your email inbox
5. Click the magic link in the email
6. **Expected Result:** 
   - Should redirect to `/auth/callback` then automatically sign you in
   - Should redirect to `/listings` (or the page you were trying to access)
   - You should be logged in without entering a password
   - Check browser console for: `✅ Auth callback: Code exchange successful`

**⚠️ Important:** You MUST request a NEW magic link - old ones won't work with the PKCE change

**If it fails:**
- Check browser console for errors
- Verify Supabase Auth URL allowlist includes `https://offaxisdeals.com/auth/callback`
- Try requesting a new magic link

---

## 2. ✅ Password Reset (CRITICAL)

**What Changed:** Removed client-side code exchange, now relies on `updateUser` for PKCE validation

**How to Test:**
1. Go to `/login`
2. Click "Forgot password?"
3. Enter your email address
4. Click "Send Reset Link"
5. Check your email inbox
6. Click the password reset link in the email
7. **Expected Result:**
   - Should show "Reset link validated" (NOT "Invalid or expired link")
   - Should allow you to enter a new password
   - After submitting, should redirect to `/login` with success message
   - You should be able to log in with the new password

**⚠️ Important:** You MUST request a NEW password reset - old links won't work

**If it fails:**
- Check browser console for errors
- Verify Supabase Auth URL allowlist includes `https://offaxisdeals.com/reset-password`
- Try requesting a new password reset link

---

## 3. ✅ Watchlist Display

**What Changed:** Enhanced logging and removed status filters - should show all saved listings

**How to Test:**
1. Go to `/listings`
2. Find a listing that's currently visible (not deleted)
3. Click "Add to Watchlist" (or similar button)
4. Go to `/watchlists`
5. **Expected Result:**
   - The listing should appear with full details (address, price, image, etc.)
   - Should NOT show "Unavailable Properties" banner for new listings
   - Should be able to remove items from watchlist

**Note:** Old watchlist items may still show as "unavailable" if those listings were deleted - this is expected behavior

**If it fails:**
- Check browser console for errors
- Verify the listing exists in the database
- Check RLS policies allow authenticated users to read saved listings

---

## 4. ✅ Admin Email Diagnostics

**What Changed:** Added proper error handling and `credentials: 'include'` for cookie-based auth

**How to Test:**
1. Log in as an admin user
2. Go to `/admin`
3. Click "📧 Send Test Email to Myself" button
4. **Expected Result:**
   - Should show success message: "Email diagnostics completed!"
   - Should show status for Magic Link and Password Reset tests
   - Check your email inbox for test emails
   - Should NOT show 401 Unauthorized error

**If it fails:**
- Check browser console for errors
- Verify you're logged in as an admin user
- Check that your account has `role: 'admin'` in the profiles table

---

## 5. ✅ Search & Geocode (CONFIGURATION TEST)

**What Changed:** Code already fixed, but needs `GOOGLE_GEOCODE_API_KEY` in Vercel (you said you added this)

**How to Test:**
1. Go to `/listings`
2. In the search bar, type a location (e.g., "Miami, FL" or "Tucson, AZ")
3. Press Enter or click search
4. **Expected Result:**
   - Map should recenter to the searched location
   - Listings should update to show properties in that area
   - Should NOT show 400 error: "Geocoding service denied request"
   - Should NOT show "Failed to Load Listings" error

**If it fails:**
- Check browser console for errors
- Verify `GOOGLE_GEOCODE_API_KEY` is set in Vercel environment variables
- Verify the API key has these APIs enabled in Google Cloud Console:
  - Geocoding API
  - Places API (Text Search)
  - Places API (Place Details)

---

## 6. ✅ General Authentication (Should Still Work)

**What Changed:** Nothing - this was already working

**How to Test:**
1. Go to `/login`
2. Enter email and password
3. Click "Sign In"
4. **Expected Result:**
   - Should log in successfully
   - Should redirect to intended page
   - Session should persist after closing browser

**This should work exactly as before - no changes made**

---

## 📋 Quick Test Summary

**Priority 1 (Must Test):**
- [ ] Magic Link - Request NEW link, click it, verify auto sign-in
- [ ] Password Reset - Request NEW reset, click it, change password, log in

**Priority 2 (Should Test):**
- [ ] Watchlist - Add NEW listing, verify it appears with data
- [ ] Admin Email - Click test button, verify success message
- [ ] Search - Type location, verify map recenters

**Priority 3 (Verify Still Works):**
- [ ] Password Login - Should work as before
- [ ] Session Persistence - Should persist after browser close

---

## 🐛 If Something Fails

1. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for red error messages
   - Copy error messages for debugging

2. **Check Network Tab:**
   - Look for failed API requests (red status codes)
   - Check request/response details

3. **Verify Configuration:**
   - Supabase Auth URL allowlist
   - Vercel environment variables
   - Google Cloud Console API settings

4. **Common Issues:**
   - **Magic Link/Password Reset:** Old links won't work - need NEW requests
   - **Watchlist:** Old items may be for deleted listings (expected)
   - **Search:** Needs `GOOGLE_GEOCODE_API_KEY` in Vercel (you said you added this)
   - **Admin Email:** Needs admin role in profiles table

---

## ✅ Success Criteria

**All tests pass if:**
- ✅ Magic link signs you in automatically
- ✅ Password reset allows you to change password
- ✅ Watchlist shows new listings with full data
- ✅ Admin email diagnostics shows success
- ✅ Search recenters map to searched location
- ✅ No console errors (except deprecation warnings which are OK)

---

**Last Updated:** November 19, 2025  
**Deployment:** After PKCE flow fixes and UTF-8 encoding fix

