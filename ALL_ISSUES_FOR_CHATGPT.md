# All Critical Issues - Ready for ChatGPT Analysis

## Context
Off Axis Deals is a Next.js 15 app using Supabase for auth/database, deployed on Vercel. After fixing PKCE flow issues, all critical features are still failing.

---

## Issue 1: Magic Link Authentication ❌

**Problem:**
- Magic link email sends successfully
- Clicking link redirects to `/login` but doesn't sign user in
- No console errors visible

**Technical Details:**
- Client: `app/supabase/client.ts` uses `flowType: 'pkce'`
- Callback: `app/auth/callback/route.ts` calls `exchangeCodeForSession(code)`
- Email link format: `https://lwhxmwvvostzlidmnays.supabase.co/auth/v1/verify?token=pkce_...&type=magiclink&redirect_to=https://www.offaxisdeals.com/auth/callback?next=/listings`
- When clicked, redirects to: `https://www.offaxisdeals.com/auth/callback?code=...&next=/listings`

**Root Cause Hypothesis:**
- PKCE code verifier not being stored in cookies when magic link is requested
- OR cookies not accessible to server-side callback route
- OR code exchange failing silently

**Code References:**
- `app/supabase/client.ts` - Client config with `flowType: 'pkce'`
- `app/auth/callback/route.ts` - Server-side callback that exchanges code
- `app/lib/supabase/server.ts` - Server client that should read cookies

**Questions for ChatGPT:**
1. How does Supabase SSR store PKCE code verifier in cookies?
2. Why might `exchangeCodeForSession` fail silently?
3. Should we switch back to implicit flow or implement email+code verification?

---

## Issue 2: Password Reset - "Auth session missing!" ❌

**Problem:**
- Password reset email sends successfully
- Link shows "Reset link validated"
- Submitting new password: "Unable to update password: Auth session missing!"
- Console: `POST /auth/v1/token?grant_type=pkce 400 (Bad Request)`

**Technical Details:**
- Current: `app/reset-password/page.tsx` tries `updateUser({ password })` directly
- Problem: `updateUser` requires active session, but PKCE code hasn't been exchanged
- Error: "Auth session missing!" from Supabase

**Root Cause:**
- PKCE code in URL needs to be exchanged for session FIRST
- Then `updateUser` can work
- Current code doesn't exchange code before calling `updateUser`

**Fix Attempted:**
- Created `/api/auth/exchange-reset-code` route to exchange code server-side
- Modified reset page to call this API before allowing password update
- But still getting 400 error on code exchange

**Code References:**
- `app/reset-password/page.tsx` - Reset page
- `app/api/auth/exchange-reset-code/route.ts` - New API route for code exchange

**Questions for ChatGPT:**
1. Why is PKCE code exchange returning 400?
2. Is the code verifier available in server-side cookies?
3. Should we use a different approach for password reset?

---

## Issue 3: Watchlist - Listing Not Found ❌

**Problem:**
- Watchlist item exists: `property_id: 939c12d5-534f-43d9-be9d-3a146b8cae55`
- Console: "Watchlist: Item without listing filtered out"
- API query returns empty for that listing ID

**Technical Details:**
- API: `app/api/watchlists/route.ts` queries: `.from('listings').select(...).in('id', listingIds)`
- RLS Policy: Should allow `SELECT` with `USING (true)` (public read)
- User: Authenticated admin user

**Root Cause Hypothesis:**
- Listing was deleted from database
- OR RLS policy not allowing access
- OR ID mismatch (UUID vs text)

**Code References:**
- `app/api/watchlists/route.ts` - Watchlist API
- `supabase/sql/FIX_LISTINGS_RLS_READ_ACCESS.sql` - RLS policy script

**Questions for ChatGPT:**
1. How to verify if listing exists in database?
2. How to check if RLS is blocking the query?
3. Should we use service-role client for watchlist queries?

---

## Issue 4: Admin Email Diagnostics - 401 Unauthorized ❌

**Problem:**
- User logged in as `admin@offaxisdeals.com`
- Clicking "Send Test Email" returns 401
- Error: "Unauthorized: Please ensure you are logged in as an admin user"

**Technical Details:**
- API: `app/api/diagnostics/email/route.ts` calls `supabase.auth.getUser()`
- Check: `isAdmin(user.id, supabase)` - may be failing
- Server client: `createSupabaseServer()` should read cookies

**Root Cause Hypothesis:**
- `getUser()` not getting session from cookies
- OR `isAdmin()` check failing
- OR session cookies not being passed correctly

**Fix Attempted:**
- Changed to use `getSession()` first, then `getUser()` as fallback
- Added better error logging

**Code References:**
- `app/api/diagnostics/email/route.ts` - Email diagnostics API
- `app/lib/admin.ts` - `isAdmin()` function
- `lib/createSupabaseServer.ts` - Server client creator

**Questions for ChatGPT:**
1. Why might `getUser()` fail to get session from cookies?
2. How to debug cookie-based auth in Next.js API routes?
3. Should we pass session token explicitly?

---

## Issue 5: Geocode API - 400 Bad Request ❌

**Problem:**
- Searching "Tucson, AZ" returns 400
- Error: "Geocoding service denied request. Check your configuration and ensure required APIs are enabled."

**Technical Details:**
- API: `app/api/geocode/route.ts` uses `GOOGLE_GEOCODE_API_KEY`
- User said they added it to Vercel
- Code checks: `process.env.GOOGLE_GEOCODE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

**Root Cause Hypothesis:**
- API key not actually set in Vercel (typo?)
- OR APIs not enabled in Google Cloud Console
- OR API key restrictions blocking server-side calls

**Code References:**
- `app/api/geocode/route.ts` - Geocode API

**Questions for ChatGPT:**
1. How to verify API key is actually set in Vercel?
2. What APIs need to be enabled?
3. What restrictions should be set?

---

## Environment Variables Needed

```
NEXT_PUBLIC_SUPABASE_URL=https://lwhxmwvvostzlidmnays.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=https://www.offaxisdeals.com
GOOGLE_GEOCODE_API_KEY=... (server-side key)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=... (client-side key)
```

---

## Key Files to Review

1. `app/supabase/client.ts` - Client config (PKCE flow)
2. `app/auth/callback/route.ts` - Magic link callback
3. `app/reset-password/page.tsx` - Password reset page
4. `app/api/auth/exchange-reset-code/route.ts` - New code exchange route
5. `app/api/watchlists/route.ts` - Watchlist API
6. `app/api/diagnostics/email/route.ts` - Admin email diagnostics
7. `app/lib/supabase/server.ts` - Server client (cookie access)

---

## Alternative Solutions to Consider

1. **Magic Link Alternative:**
   - Email + 6-digit code verification
   - More reliable, no PKCE needed

2. **Password Reset Alternative:**
   - Email + 6-digit code verification
   - More reliable, no PKCE needed

3. **Switch to Implicit Flow:**
   - Use hash-based tokens instead of PKCE
   - Less secure but more compatible

---

## Next Steps

1. Debug PKCE code verifier storage/retrieval
2. Fix password reset code exchange
3. Investigate watchlist RLS/deleted listing
4. Fix admin auth cookie reading
5. Verify geocode API key configuration

---

**Last Updated:** November 19, 2025  
**Status:** All critical features failing, need systematic debugging

