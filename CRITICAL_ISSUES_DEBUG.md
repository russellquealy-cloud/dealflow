# Critical Issues After Deployment - November 19, 2025

## Summary
All five critical features are still failing after deployment. Root causes appear to be:
1. PKCE code verifier not being stored/accessed correctly
2. Password reset requires session before updateUser
3. Watchlist RLS or deleted listing issue
4. Admin auth check failing
5. Geocode API key configuration issue

---

## Issue 1: Magic Link - Not Signing In ❌

**Symptoms:**
- Email sends successfully
- Clicking magic link redirects to `/login` but doesn't sign user in
- No console errors visible

**Root Cause Analysis:**
- Changed client to `flowType: 'pkce'` but PKCE code verifier may not be stored in cookies when magic link is requested
- Server-side callback route tries to exchange code but verifier isn't available
- OR cookies aren't being passed correctly between client and server

**Technical Details:**
- Client: `app/supabase/client.ts` uses `flowType: 'pkce'`
- Callback: `app/auth/callback/route.ts` tries `exchangeCodeForSession(code)`
- Error: Code exchange likely failing silently or verifier not in cookies

**Possible Solutions:**
1. Verify PKCE verifier is stored in cookies when requesting magic link
2. Check cookie domain/path settings match between client and server
3. Consider switching back to implicit flow if PKCE continues to fail
4. OR implement alternative: email + code verification (6-digit code instead of magic link)

---

## Issue 2: Password Reset - "Auth session missing!" ❌

**Symptoms:**
- Password reset email sends successfully
- Link shows "Reset link validated" 
- But when submitting new password: "Unable to update password: Auth session missing!"
- Console shows: `POST /auth/v1/token?grant_type=pkce 400 (Bad Request)`

**Root Cause Analysis:**
- `updateUser({ password })` requires an active session
- PKCE code in URL needs to be exchanged for session FIRST
- Current code tries to use `updateUser` without exchanging code
- The 400 error suggests code exchange is failing

**Technical Details:**
- Current: `app/reset-password/page.tsx` tries `updateUser({ password })` directly
- Problem: No session exists, so updateUser fails
- Need: Exchange PKCE code for session, THEN update password

**Possible Solutions:**
1. Exchange code for session on the reset page before allowing password update
2. Use server-side API route to handle code exchange + password update
3. OR switch to implicit flow (hash-based) for password reset

---

## Issue 3: Watchlist - Listing Not Found ❌

**Symptoms:**
- Watchlist item exists in database
- Console shows: "Watchlist: Item without listing filtered out"
- Property ID: `939c12d5-534f-43d9-be9d-3a146b8cae55`

**Root Cause Analysis:**
- Listing query returns empty (RLS blocking OR listing deleted)
- API logs show watchlist item exists but listing query fails
- Could be: RLS policy, listing deleted, or ID mismatch

**Technical Details:**
- API: `app/api/watchlists/route.ts` queries listings by ID
- Query: `.in('id', listingIds)` - should return listing if it exists
- RLS: May be blocking access to listing

**Possible Solutions:**
1. Check if listing with that ID actually exists in database
2. Verify RLS policies allow authenticated users to read saved listings
3. Add service-role client for watchlist queries (bypass RLS for saved items)
4. OR gracefully handle deleted listings (already implemented, but may need refinement)

---

## Issue 4: Admin Email Diagnostics - 401 Unauthorized ❌

**Symptoms:**
- Clicking "Send Test Email" returns 401
- User is logged in as `admin@offaxisdeals.com`
- Error: "Unauthorized: Please ensure you are logged in as an admin user"

**Root Cause Analysis:**
- `supabase.auth.getUser()` may not be getting session from cookies
- OR `isAdmin()` check is failing
- OR session isn't being passed correctly to API route

**Technical Details:**
- API: `app/api/diagnostics/email/route.ts` calls `supabase.auth.getUser()`
- Check: `isAdmin(user.id, supabase)` - may be failing
- Issue: Server-side client may not have access to session cookies

**Possible Solutions:**
1. Verify `createSupabaseServer()` correctly reads session cookies
2. Check `isAdmin()` function logic
3. Add debug logging to see what `getUser()` returns
4. Verify admin account has `role: 'admin'` in profiles table

---

## Issue 5: Geocode API - 400 Bad Request ❌

**Symptoms:**
- Searching for "Tucson, AZ" returns 400
- Error: "Geocoding service denied request. Check your configuration and ensure required APIs are enabled."

**Root Cause Analysis:**
- API key may not be configured correctly in Vercel
- OR API key doesn't have required APIs enabled
- OR API key has restrictions that block the request

**Technical Details:**
- API: `app/api/geocode/route.ts` uses `GOOGLE_GEOCODE_API_KEY`
- User said they added it to Vercel, but may need:
  - APIs enabled: Geocoding API, Places API, Places Details API
  - Key restrictions configured correctly
  - Key actually set in Vercel environment variables

**Possible Solutions:**
1. Verify `GOOGLE_GEOCODE_API_KEY` is set in Vercel (check spelling)
2. Verify APIs are enabled in Google Cloud Console
3. Check API key restrictions (should allow server-side calls)
4. Test API key directly with curl/Postman

---

## Recommended Fix Priority

1. **Password Reset** - Most critical, affects user recovery
2. **Magic Link** - High priority, affects user onboarding
3. **Admin Email** - Medium priority, affects admin workflows
4. **Watchlist** - Medium priority, affects user experience
5. **Geocode** - Lower priority, affects search but not core functionality

---

## Alternative Solutions

If PKCE continues to fail, consider:

1. **Magic Link Alternative:**
   - Email + 6-digit code verification
   - User enters code on website
   - More reliable, no PKCE needed

2. **Password Reset Alternative:**
   - Email + 6-digit code verification
   - User enters code + new password
   - More reliable, no PKCE needed

3. **Switch to Implicit Flow:**
   - Use hash-based tokens instead of PKCE
   - Less secure but more compatible
   - May work better with current setup

---

## Next Steps

1. Debug PKCE code verifier storage/retrieval
2. Fix password reset to exchange code before updateUser
3. Investigate watchlist RLS policies
4. Fix admin auth check
5. Verify geocode API key configuration

---

**Last Updated:** November 19, 2025  
**Status:** All critical features failing, need systematic debugging

