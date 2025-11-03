<!-- 4deaa60c-a1b4-4224-ba68-596fcddbe22e a2c64dc9-f1d1-4848-9637-236eb80abed1 -->
# Beta Testing Game Plan - Off Axis Deals

## Current Status: 95% Complete, Ready for Testing

### What's Done ✅

- Core platform (auth, listings, map, messaging)
- Database optimized (35 indexes, Supabase Pro)
- UI/UX complete with role-based features
- Security (RLS policies)
- Code infrastructure (email system, AI analyzer UI)

### What Needs Testing & Setup 🔴

---

## PHASE 1: Critical Feature Testing (Do First - 30 min)

### A. Core Functionality Testing

**Priority: CRITICAL**

1. **Listings Page Performance** (`/listings`)

   - [ ] Load time < 5 seconds (should be fast with Pro + indexes)
   - [ ] Listings populate immediately (no "Loading..." forever)
   - [ ] Map shows markers
   - [ ] Pan/zoom updates listings in < 1 second
   - [ ] Filters work (price, beds, baths, sqft)

2. **Authentication Flow**

   - [ ] Sign in works (`/login`)
   - [ ] Sign out works (no hanging)
   - [ ] Session persists after refresh
   - [ ] Redirects work after login

3. **Role-Based Features**

   - [ ] Wholesaler sees: "My Listings", "Post a Deal", "Alerts"
   - [ ] Investor sees: "Watchlist", "Saved", "Alerts"
   - [ ] Header buttons match user role
   - [ ] Profile save works (`/portal/investor` or `/portal/wholesaler`)

4. **Messaging System** (`/messages`)

   - [ ] Page loads < 10 seconds
   - [ ] Conversations list appears
   - [ ] No "Loading messages..." forever
   - [ ] Can send messages (if you have listings)

---

## PHASE 2: Service Integration Setup (15 min)

### A. Email System Setup

**Priority: HIGH**

**Files:** `EMAIL_SETUP_CHECKLIST.md`

1. **Add Environment Variables to Vercel**
   ```env
   SMTP_HOST=mail.privateemail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=no_reply@offaxisdeals.com
   SMTP_PASS=[YOUR_PASSWORD]
   SMTP_FROM=Off Axis Deals <no_reply@offaxisdeals.com>
   SMTP_REPLY_TO=customerservice@offaxisdeals.com
   SUPPORT_EMAIL=customerservice@offaxisdeals.com
   SALES_EMAIL=sales@offaxisdeals.com
   NOREPLY_EMAIL=no_reply@offaxisdeals.com
   ```

2. **Redeploy After Adding Vars**

   - [ ] Push changes to trigger deployment
   - [ ] Wait for deployment to complete

3. **Test Email System**
   ```bash
   # Test diagnostics
   curl https://yourdomain.com/api/email-diag
   
   # Test sending
   curl -X POST https://yourdomain.com/api/test-email
   ```


   - [ ] Submit feedback form at `/feedback`
   - [ ] Submit contact sales at `/contact-sales`
   - [ ] Verify emails received

### B. AI Analyzer Setup (Optional - Needs OpenAI Key)

**Priority: MEDIUM**

1. **Add OpenAI API Key to Vercel**
   ```env
   OPENAI_API_KEY=sk-[YOUR_KEY]
   ```

2. **Test Analyzer** (`/tools/analyzer`)

   - [ ] Investor analyzer shows UI (works without API key - mock data)
   - [ ] Wholesaler analyzer shows UI (works without API key - mock data)
   - [ ] After adding API key, verify real analysis works

---

## PHASE 3: Feature-Specific Testing (20 min)

### A. Alerts System (`/alerts`)

**SQL Already Run:** `CREATE_USER_ALERTS_TABLE_WORKS.sql` ✅

- [ ] Page loads
- [ ] Correct alerts show for your role:
  - Investors: 8 investor alerts
  - Wholesalers: 8 wholesaler alerts
- [ ] Toggle switches work
- [ ] Changes save immediately
- [ ] No console errors

### B. My Listings (Wholesalers Only) (`/my-listings`)

- [ ] Page loads
- [ ] Shows your listings in 4-column grid
- [ ] Images not stretched
- [ ] Can edit listings
- [ ] Can delete listings
- [ ] "Post a Deal" button works

### C. Pricing & Upgrades (`/pricing`)

- [ ] Page loads
- [ ] Investor/Wholesaler toggle works
- [ ] Monthly/Yearly toggle works
- [ ] "Upgrade" buttons work (should redirect to Stripe)
- [ ] No 401 errors
- [ ] No login loops

### D. Account Page (`/account`)

- [ ] Page loads
- [ ] Shows correct plan (not "Free" if you're Pro)
- [ ] Profile type section works
- [ ] Stats display correctly
- [ ] "Update Profile" button works

---

## PHASE 4: Production Verification (15 min)

### A. Deployed Site Testing

**URL:** Your production domain

1. **Homepage** (`/` or `/welcome`)

   - [ ] Welcome page loads first
   - [ ] "Browse Listings" button works
   - [ ] Looks professional

2. **Listings Page** (`/listings`)

   - [ ] Loads quickly (< 5 sec)
   - [ ] Miami listings populate (or your default area)
   - [ ] Map works
   - [ ] No console errors

3. **Legal Pages**

   - [ ] `/terms` - Terms of Service
   - [ ] `/privacy` - Privacy Policy
   - [ ] `/refund-policy` - Refund Policy
   - [ ] `/disclaimer` - Disclaimer
   - [ ] Footer links work

4. **Navigation Links**

   - [ ] All header links work
   - [ ] Footer links work
   - [ ] No 404 errors on main pages

---

## PHASE 5: Database Verification (5 min)

### A. Verify Tables Exist

Run in Supabase SQL Editor:

```sql
-- Check user_alerts table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'user_alerts';

-- Check columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'user_alerts';
```

- [ ] `user_alerts` table exists
- [ ] Has columns: id, user_id, role, alert_type, is_enabled

### B. Verify Indexes

```sql
-- Check listings indexes (should be 35+)
SELECT count(*) FROM pg_indexes 
WHERE tablename = 'listings' AND schemaname = 'public';
```

- [ ] At least 30 indexes exist on listings table

---

## Quick Reference: Key URLs to Test

### Core Pages

- `/` - Welcome page (should load first)
- `/listings` - Main listings page
- `/login` - Sign in
- `/signup` - Sign up
- `/account` - Account page
- `/pricing` - Pricing page

### Role-Specific Pages

- `/my-listings` - Wholesaler listings
- `/post` or `/my-listings/new` - Post a deal
- `/watchlists` - Investor watchlists
- `/saved-searches` - Saved searches
- `/alerts` - Alert preferences
- `/messages` - Messages

### Tools & Features

- `/tools/analyzer` - AI Analyzer
- `/feedback` - Feedback form
- `/contact-sales` - Contact sales

### Legal Pages

- `/terms` - Terms of Service
- `/privacy` - Privacy Policy
- `/refund-policy` - Refund Policy
- `/disclaimer` - Disclaimer

---

## Testing Order (Recommended)

1. **Test Core Features First** (Phase 1) - 30 min

   - Listings page performance
   - Auth flow
   - Role-based features

2. **Setup Services** (Phase 2) - 15 min

   - Email env vars
   - Redeploy
   - Test email

3. **Test New Features** (Phase 3) - 20 min

   - Alerts system
   - My Listings
   - Pricing

4. **Production Verification** (Phase 4) - 15 min

   - Deployed site
   - All pages load
   - No 404s

5. **Database Check** (Phase 5) - 5 min

   - Tables exist
   - Indexes exist

**Total Time: ~85 minutes**

---

## Known Issues to Watch For

1. **Listings Not Loading**

   - Check console for "Listings load timeout"
   - Verify Supabase Pro is active
   - Check indexes were created

2. **Email Not Sending**

   - Verify env vars in Vercel
   - Check SMTP credentials
   - Test with curl commands

3. **404 Errors**

   - Some pages like `/docs/api` don't exist yet (harmless)
   - Focus on main feature pages

4. **Slow Performance**

   - Should be fast now with Pro + indexes
   - If still slow, check query limits

---

## Success Criteria

### Ready for Beta When:

- ✅ All Phase 1 tests pass
- ✅ Listings load < 5 seconds
- ✅ No critical errors
- ✅ Email system working (optional but recommended)
- ✅ All role-based features work correctly

### Nice to Have (Not Blocking):

- AI Analyzer with real API (currently shows mock data)
- All pages polished (some can be iterated)

---

## Next Steps After Testing

1. **Document any bugs found**
2. **Fix critical issues**
3. **Deploy fixes**
4. **Re-test**
5. **Launch beta!** 🚀

### To-dos

- [ ] Test core functionality: listings page performance, auth flow, role-based features, messaging system
- [ ] Add email environment variables to Vercel (SMTP config) and redeploy
- [ ] Test email system: diagnostics endpoint, test email endpoint, feedback form, contact sales form
- [ ] Test alerts system: verify correct alerts show for role, toggles work, changes save
- [ ] Test My Listings page: 4-column grid, image display, edit/delete functionality (wholesalers only)
- [ ] Test pricing page: toggles work, upgrade buttons redirect correctly, no auth errors
- [ ] Test account page: shows correct plan, profile type section, stats display
- [ ] Verify deployed site: all pages load, no 404s, legal pages work, navigation links work
- [ ] Verify database: user_alerts table exists, listings indexes exist (35+ indexes)
- [ ] Setup AI Analyzer: add OpenAI API key to Vercel (optional - currently shows mock data)