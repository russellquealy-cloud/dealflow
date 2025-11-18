# Manual Steps Required After QA Fixes

## 🔴 Critical - Must Do Before Testing

### 1. Supabase Auth URL Allowlist
**Location:** Supabase Dashboard → Authentication → URL Configuration

**Add these URLs to the "Redirect URLs" allowlist:**

**Development:**
- `http://localhost:3000/login`
- `http://localhost:3000/reset-password`
- `http://localhost:3000/auth/callback` (NEW - for magic link mobile fix)

**Production:**
- `https://offaxisdeals.com/login`
- `https://offaxisdeals.com/reset-password`
- `https://offaxisdeals.com/auth/callback` (NEW - for magic link mobile fix)

**Why:** The magic link fix now uses `/auth/callback` route for better mobile compatibility. This URL must be whitelisted.

---

### 2. Verify Environment Variables
**Location:** Vercel Dashboard → Project Settings → Environment Variables

**Required Variables:**
- `NEXT_PUBLIC_SITE_URL` - Must be set to `https://offaxisdeals.com` (or your production domain)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `GOOGLE_MAPS_SERVER_KEY` or `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - For geocoding

**Action:** Verify all are set correctly, especially `NEXT_PUBLIC_SITE_URL` for production.

---

### 3. Supabase Email Configuration (If Not Already Done)
**Location:** Supabase Dashboard → Project Settings → Auth → SMTP Settings

**Required:**
- Configure SMTP settings (Namecheap Private Email or your email provider)
- Verify sender email address
- Test email delivery

**See:** `docs/SUPABASE_EMAIL_CONFIG.md` for detailed instructions

---

## 🟡 Recommended - Before Production Launch

### 4. Test the Fixes
After deploying, manually test:

**Listings (L1, L2):**
- [ ] Miami seed listings appear in both map and list view
- [ ] Create a new listing as wholesaler - verify it appears in:
  - My Listings page
  - Public listings page (when in bounds)
  - Map markers
- [ ] Check browser console for defensive logging (should see "📊 Listings loaded" logs)

**Search/Map Sync (L3):**
- [ ] Search for "Miami, FL" - map should recenter
- [ ] List should update to show listings in Miami area
- [ ] No 404/400 errors in console for geocoding

**Magic Link (A2):**
- [ ] Request magic link on mobile device
- [ ] Click link in email
- [ ] Should be logged in and redirected (not stuck on login page)

**Password Reset (A3):**
- [ ] Request password reset
- [ ] Click link in email
- [ ] Set new password
- [ ] Should redirect to login with success message
- [ ] Log in with new password

**Stripe Checkout (P1):**
- [ ] Try to upgrade subscription
- [ ] Should not see "customer and customer_email" error
- [ ] Checkout should complete successfully

**Browser Notice:**
- [ ] Normal page load should NOT show browser notice
- [ ] Only shows if Maps API actually fails

---

### 5. Deploy to Vercel
1. Commit and push all changes
2. Vercel will auto-deploy
3. Monitor build logs for any errors
4. Verify deployment succeeds

---

### 6. Database Check (If Needed)
If listings still don't show after deployment:

1. Run the diagnostic endpoint: `/api/debug/listings` (admin only)
2. Check console logs for status filter warnings
3. Verify seed data status values match the filter:
   - Status should be: `null`, `'live'`, `'active'`, or `'published'`
   - Status should NOT be: `'draft'` or `'archived'`

If seed data has different status values, you may need to:
- Update seed data to use one of the allowed statuses, OR
- Add more status values to the OR filter in `app/lib/listings.ts`

---

## 📝 Optional - Nice to Have

### 7. Review Logs
After testing, check:
- Browser console for any warnings/errors
- Vercel function logs for API errors
- Supabase logs for RLS policy issues

### 8. Update Documentation
- Update `TEST_MATRIX.md` with test results
- Mark completed items in `PRE_LAUNCH_ISSUES.md`

---

## ⚠️ Known Issues That May Need Manual Intervention

### Listings Status Filter
If Miami/Tucson listings still don't show:
- The status filter may be too restrictive for your seed data
- Check what status values your seed data actually has
- May need to update the OR filter in `app/lib/listings.ts` to include more status values

### Watchlist
- Watchlist was fixed in previous session
- If still not working, check:
  - RLS policies for `watchlists` table
  - Verify `property_id` matches `listings.id` (UUID type)

---

## 🚀 Quick Start Checklist

1. ✅ Add `/auth/callback` to Supabase redirect URL allowlist
2. ✅ Verify `NEXT_PUBLIC_SITE_URL` is set in Vercel
3. ✅ Deploy to Vercel
4. ✅ Test magic link on mobile
5. ✅ Test password reset
6. ✅ Test listings visibility
7. ✅ Test search/map sync
8. ✅ Test Stripe checkout

---

## Need Help?

- Check `QA_FIXES_SUMMARY.md` for detailed fix explanations
- Check `docs/SUPABASE_EMAIL_CONFIG.md` for email setup
- Check browser console and Vercel logs for errors
- Run `/api/debug/listings` (admin) to diagnose listing issues

