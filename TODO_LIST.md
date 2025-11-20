# Off Axis Deals - TODO List
**Last Updated:** November 19, 2025

---

## 🔴 CRITICAL - Must Fix Before Launch

### 1. Fix Geocode API Key Configuration
**Status:** 🔴 BLOCKING  
**Priority:** Highest  
**Issue:** Geocode API returning 400 - "Geocoding service denied request"

**Actions:**
- [ ] Check Vercel environment variables for Google Maps API keys
- [ ] Verify API key is valid in Google Cloud Console
- [ ] Enable required APIs (Geocoding, Places Text Search, Place Details)
- [ ] Check API key restrictions
- [ ] Test geocode API directly
- [ ] Verify search functionality works after fix

**Files:**
- `app/api/geocode/route.ts`
- Vercel Dashboard → Environment Variables

**Estimated Time:** 0.5-1 day

---

### 2. Fix Magic Link Authentication
**Status:** 🔴 BLOCKING  
**Priority:** High  
**Issue:** Magic link email sent successfully ✅, but clicking link doesn't sign user in ❌

**Current Status:**
- ✅ Email delivery working - magic link emails are sent and received
- ❌ Clicking magic link redirects to login page but doesn't sign user in
- ❌ No console errors, but session not being established

**Actions:**
- [ ] Debug why session isn't being established after callback
- [ ] Check if `/auth/callback` route is being hit correctly
- [ ] Verify Supabase auth configuration (redirect URLs, flow type)
- [ ] Check if cookies are being set correctly after callback
- [ ] Add detailed logging to track session creation flow
- [ ] Test on both desktop and mobile
- [ ] Verify Supabase Auth URL allowlist includes `/auth/callback`
- [ ] Check if `detectSessionInUrl` is working in Supabase client
- [ ] Verify session is being stored in cookies/localStorage

**Files:**
- `app/auth/callback/route.ts` - Callback handler
- `app/login/page.tsx` - Magic link request
- `app/supabase/client.ts` - Client configuration
- `app/providers/AuthProvider.tsx` - Session management
- Supabase Dashboard → Authentication → URL Configuration

**Estimated Time:** 1-2 days

---

### 2b. Fix Password Reset Flow
**Status:** 🔴 BLOCKING  
**Priority:** High  
**Issue:** Password reset email sent successfully ✅, but reset page shows errors ❌

**Current Status:**
- ✅ Email delivery working - password reset emails are sent and received
- ❌ Clicking reset link shows "Invalid or expired reset link" immediately
- ❌ User cannot complete password reset

**Actions:**
- [ ] Debug why token validation is failing on reset page
- [ ] Check if reset link token format matches what Supabase expects
- [ ] Verify Supabase auth configuration (redirect URLs, token expiration)
- [ ] Check if `detectSessionInUrl` is working for password reset flow
- [ ] Add detailed logging to track token validation flow
- [ ] Test on both desktop and mobile
- [ ] Verify Supabase Auth URL allowlist includes `/reset-password`
- [ ] Check if token is being extracted correctly from URL hash/query

**Files:**
- `app/reset-password/page.tsx` - Reset page handler
- `app/login/page.tsx` - Password reset request
- `app/supabase/client.ts` - Client configuration
- Supabase Dashboard → Authentication → URL Configuration

**Estimated Time:** 1 day

---

### 3. Fix Watchlist Display
**Status:** 🔴 BLOCKING  
**Priority:** High  
**Issue:** Saved properties not showing in watchlist UI

**Actions:**
- [ ] Investigate watchlist API response format
- [ ] Check frontend component data mapping
- [ ] Verify RLS policies allow proper data access
- [ ] Test watchlist save/display flow end-to-end
- [ ] Fix data display issue
- [ ] Add error handling and user feedback

**Files:**
- `app/api/watchlists/route.ts`
- `app/watchlists/page.tsx`

**Estimated Time:** 1 day

---

### 4. Configure Supabase Email Delivery
**Status:** ✅ COMPLETE  
**Priority:** ~~High~~ (Completed)  
**Issue:** ~~Email delivery not configured in Supabase~~ ✅ **RESOLVED**

**Completed Actions:**
- ✅ Verified SMTP settings in Supabase Auth → Email Templates
- ✅ Checked SMTP credentials (Namecheap Private Email)
- ✅ Tested email delivery in Supabase dashboard
- ✅ Emails are being sent and received successfully

**Remaining Issues:**
- ⚠️ Magic link sign-in flow not working on website (emails sent, but clicking link doesn't sign user in)
- ⚠️ Password reset flow not working on website (emails sent, but reset page shows errors)

**Note:** Email delivery itself is working. The issues are with the authentication flows after clicking the email links.

**Files:**
- `app/auth/callback/route.ts` - Magic link callback
- `app/login/page.tsx` - Magic link request
- `app/reset-password/page.tsx` - Password reset page
- Supabase Dashboard → Authentication → URL Configuration

**Estimated Time:** 1-2 days (for fixing auth flows, not email config)

---

## 🟠 HIGH PRIORITY - Should Fix Soon

### 5. Fix Tucson Listing Coordinates
**Status:** 🟠 FIXED (Code) - Needs API Key Fix  
**Priority:** Medium-High  
**Issue:** Tucson listing exists but has no coordinates (latitude/longitude)

**Root Cause:** Listing was created before automatic geocoding was implemented

**Solution Applied:**
- ✅ Added automatic geocoding to all listing forms
- ✅ Geocoding now happens automatically on create/edit
- ⚠️ Geocoding currently fails due to API key issue (see item #1)

**Actions:**
- [ ] Fix geocode API key (see item #1)
- [ ] Edit Tucson listing in `/my-listings`
- [ ] Change address slightly (or just save) to trigger geocoding
- [ ] Verify coordinates are populated
- [ ] Verify listing appears on map

**Files:**
- `app/components/CreateListingForm.tsx` - ✅ Fixed
- `app/post/page.tsx` - ✅ Fixed
- `app/my-listings/page.tsx` - ✅ Fixed
- `AUTO_GEOCODING_FIX.md` - Documentation

**Estimated Time:** 0.5 day (after API key is fixed)

---

### 6. Mobile UX Final Review
**Status:** 🟠 REVIEW  
**Priority:** Medium  
**Issue:** Need final review and testing on physical devices

**Actions:**
- [ ] Final mobile layout review with screenshots
- [ ] Test all core flows on physical mobile devices
- [ ] Verify touch targets meet accessibility standards
- [ ] Test on various screen sizes (iPhone SE to iPad)
- [ ] Document any remaining issues

**Estimated Time:** 1-2 days

---

### 7. Notification System Testing
**Status:** 🟠 TESTING  
**Priority:** Medium  
**Issue:** Need to verify all notification triggers work

**Actions:**
- [ ] Test all notification triggers end-to-end
- [ ] Verify email delivery for all notification types
- [ ] Test notification preferences toggles
- [ ] Verify in-app notifications appear correctly

**Estimated Time:** 1 day

---

## 🟡 MEDIUM PRIORITY - Nice to Have

### 8. Monthly Cleanup Job Setup
**Status:** 🟡 SETUP  
**Priority:** Low-Medium  
**Issue:** Cleanup endpoint exists but not scheduled

**Actions:**
- [ ] Set up Supabase cron job OR Vercel cron job
- [ ] Test cleanup job execution
- [ ] Monitor cleanup job logs

**Files:**
- `app/api/cron/cleanup-ai-usage/route.ts`
- Vercel Dashboard → Cron Jobs OR Supabase Dashboard → Database → Cron

**Estimated Time:** 0.5 day

---

### 9. Browser Compatibility Testing
**Status:** 🟡 TESTING  
**Priority:** Low-Medium  
**Issue:** Need full testing across browsers

**Actions:**
- [ ] Full testing on Chrome, Firefox, Safari, Edge
- [ ] Test on mobile browsers (iOS Safari, Android Chrome)
- [ ] Verify autocomplete works consistently
- [ ] Test map functionality across browsers

**Estimated Time:** 1-2 days

---

### 10. Create Test Stripe Promo Codes
**Status:** 🟡 SETUP  
**Priority:** Low  
**Issue:** Promo codes enabled but no test codes created

**Actions:**
- [ ] Follow instructions in `docs/STRIPE_PROMO_CODES.md`
- [ ] Create 4 test promo codes:
  - `TEST10` - 10% off Investor Basic Monthly
  - `TEST20` - 20% off Investor Pro Yearly
  - `TEST15` - 15% off Wholesaler Basic Monthly
  - `TEST25` - 25% off Wholesaler Pro Yearly
- [ ] Test in checkout flow
- [ ] Delete test codes after verification

**Files:**
- `docs/STRIPE_PROMO_CODES.md`
- Stripe Dashboard → Products → Coupons

**Estimated Time:** 0.5 day

---

## 📝 Notes

### Completed Today (November 19, 2025)
- ✅ Fixed listings tiles display on desktop
- ✅ Improved geocode error handling
- ✅ Enhanced magic link callback route
- ✅ Made password reset more forgiving
- ✅ Added Stripe promo code support
- ✅ Created Tucson listing debug guide
- ✅ Created Stripe promo codes setup guide

### Known Issues
- Geocode API key needs configuration (blocking search)
- Magic link not signing users in (blocking auth) - emails work ✅
- Password reset not working (blocking auth) - emails work ✅
- Watchlist display broken (blocking core feature)
- Tucson listing visibility needs investigation (will be fixed after geocode API key)

### Next Session Priorities
1. Fix geocode API key (quick win)
2. Debug magic link authentication
3. Investigate Tucson listing
4. Fix watchlist display

---

**Last Updated:** November 19, 2025

