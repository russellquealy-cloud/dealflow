# Off Axis Deals - Project Status Report
**Generated:** November 8, 2025  
**Last Updated:** November 10, 2025

## Overall Completion: **~80%**

---

## Feature Completion Breakdown

### 🔐 Authentication & User Management: **80%**
- ✅ User registration
- ✅ Email/password login
- ✅ Magic link login
- ✅ Session management
- ⚠️ Wholesaler “Post Deal” loop intermittently forces re-auth
- ✅ Profile creation & updates
- ✅ Role-based access (wholesaler / investor / admin)
- ✅ Password reset (link surfaced on login)

**Issues:**
- Post-a-deal redirect loop for wholesalers (needs root cause + fix)
- Session refresh race conditions still visible in rare cases on mobile

---

### 🏠 Listings Management & Map: **74%**
- ✅ Create / edit / delete listings (wholesalers)
- ✅ View listings (all users) with filters
- ✅ Listing detail page + media gallery
- ✅ Featured listings (including map/star styling)
- ✅ Polygon draw & persistence
- ⚠️ Search autocomplete suggestions intermittently fail and map does not recenter on selection
- ✅ Map flicker eliminated; drawn polygons persist across navigation
- ✅ My Listings management view

**Issues:**
- Restore Google Places autocomplete suggestions and recenter map on result select / submit
- Broaden saved search UX to feel less manual; review mobile layout spacing

---

### 💰 Payments & Subscriptions: **82%**
- ✅ Stripe integration end-to-end
- ✅ Pricing page + tier gating
- ✅ Billing history + plan metadata
- ✅ Upgrade checkout uses correct customer/customer_email logic
- ✅ AI usage quotas enforced per plan with monthly tracking

**Issues:**
- Surface AI usage reporting in UI/admin views
- Ensure monthly cleanup job for `ai_usage` is scheduled in production

---

### 💬 Messaging: **70%**
- ✅ Conversation list (with fallback when view missing)
- ✅ Message send/receive with RLS
- ✅ Unread badge in header
- ⚠️ Notification hookup for message events partially complete
- ⚠️ Visual read receipts not surfaced in UI

**Issues:**
- RLS still failing for some investor watchlist/message writes (401/500 reports)
- Need regression sweep for auth headers on all message endpoints
- Surface read-state indicator inside thread view for clarity

---

### 🔔 Notifications & Alerts: **72%**
- ✅ Supabase tables + RLS for preferences & notifications
- ✅ API routes: preferences, list, unread count
- ✅ Settings UI with optimistic toggles (accessible; needs navigation entry point)
- ✅ In-app notifications page + header badge
- ⚠️ Event wiring missing for several flows (repair estimate, performance, etc.)
- ⚠️ Email delivery not re-validated after schema changes

**Issues:**
- Need job/helpers connected for market trend, verification, subscription renewal, feedback
- Confirm service role client available in every environment
- Add first-class navigation link to notification preferences

---

### 🛠️ Tools & Insights: **62%**
- ✅ Investor & wholesaler analyzers (mock responses clarified)
- ⚠️ Watchlists API returning 500 for some users (fetch fallback needs repair)
- ✅ Saved searches UI
- ⚠️ Saved search creation throws 500 for some investors (RLS)
- ⚠️ AI quotas: plan allowances not enforced; test accounts should be unlimited
- ❌ Advanced analytics dashboard still pending

**Issues:**
- Supabase policies need review for saved searches & watchlists; resolve current 500s
- AI usage counters must respect tiers + monthly reset
- Restore Google Places suggestions + map recenter for search workflow

---

### 📱 Mobile & UX Polish: **55%**
- ✅ Responsive layout across core flows
- ⚠️ Map/search components cramped on smaller viewports (My Listings form too tight)
- ⚠️ Mobile session restore occasionally flashes logged-out state
- ❌ PWA / native wrapper not in scope yet

**Issues:**
- Need pass on spacing for My Listings edit form + filter drawers
- Investigate mobile auth refresh flicker

---

### 🔒 Admin & Reporting: **35%**
- ✅ Basic admin dashboard
- ⚠️ User management read-only; no moderation tools
- ❌ Content/report workflow not built
- ❌ System audit logs missing

**Issues:**
- Expand admin actions for support staff
- Add notification + AI usage reporting

---

## Critical Bugs (Blocking Launch)

1. **Stripe Upgrade Failure** 🔴  
   `customer`/`customer_email` conflict breaks Basic → Pro checkout.
2. **Watchlist / Saved Search API Errors** 🔴  
   Fetching watchlists returns 500 (service role fallback + policies need fix).
3. **AI Usage Limits** 🔴  
   Wholesaler/Investor accounts blocked despite intended allowances; quotas need enforcement + reset logic.
4. **Wholesaler Post Deal Loop** 🟠  
   Posting a deal bounces users back to login; high impact on supply.
5. **Search Autocomplete Regression** 🟠  
   Places suggestions not returning results; map fails to recenter on typed location.

---

## High Priority Follow-Ups

1. Restore Places autocomplete + map recenter behaviour; modernize search save UX.
2. Wire notification events for buyer interest, market trend, subscription renewal, feedback.
3. Messaging RLS audit plus wholesaler read-only guardrails and visible read receipts.
4. Finish Stripe checkout fix + AI quota enforcement once blockers cleared.

---

## Medium Priority Items

1. My Listings edit form spacing / layout cleanup.
2. Mobile session flicker + auth refresh race conditions.
3. Email delivery smoke-test (SendGrid / Supabase).  
4. Analyzer math validation + user education copy refinements.

---

## Low Priority / Backlog

1. PDF export + advanced analytics dashboards.  
2. Push notifications & PWA support.  
3. Admin moderation tooling, system logs, telemetry hardening.

---

## Deployment Checklist (Snapshot)

### Pre-Deployment
- [ ] Critical bugs above resolved & retested
- [x] Environment vars (incl. `SUPABASE_SERVICE_ROLE_KEY`) on Vercel
- [ ] Latest DB migration (`20250210_notifications.sql`) applied in all envs
- [ ] Stripe keys verified + webhook logs clean
- [ ] Supabase RLS policies regression tested

### Authentication
- [x] Sign in / sign up / reset password
- [ ] Wholesaler post-deal flow (fix loop)
- [ ] Mobile session restore (verify)

### Listings & Map
- [x] Listings load & filter
- [x] Featured markers render (star)
- [ ] Drawn area persistence under stress
- [ ] Search autocomplete recenter

### Payments
- [ ] Upgrade checkout flow (Basic → Pro) passes
- [ ] Quota reset job confirmed

### Messaging & Notifications
- [x] Conversation list / send message
- [ ] RLS audit for watchlists/saved searches/messages
- [ ] Notification triggers verified (manual + automated)

### Tools & Usage
- [ ] AI analyzers respect plan limits (with unlimited test override)
- [ ] Saved search create/delete without 500s

### Post-Deployment
- [ ] Monitor logs (Vercel + Supabase) for 401/500 regressions
- [ ] Verify Stripe webhook events processed
- [ ] QA notifications badge + settings
- [ ] Validate AI usage counters and resets

---

## Next Steps (Order)

1. Patch Stripe checkout parameters (choose `customer` or `customer_email` per session).  
2. Resolve Supabase watchlist/saved-search 500s using service role + policy review.  
3. Implement AI usage quota service (per tier + monthly reset + test exemptions).  
4. Fix wholesaler Post Deal redirect loop + finalize My Listings form spacing.  
5. Restore Google Places suggestions + auto recentre, then modernize search-save UX.  
6. Wire remaining notification triggers (market trend, subscription renewal, feedback) + add navigation entry to settings.  
7. Regression test messaging endpoints, surface read-state, and ensure auth headers across clients.  

---

## Estimated Time to Production-Ready

- Critical fixes: 2 days  
- High priority polish: 3-4 days  
- Medium priority backlog: 1 week  
- Total ETA: **~2 weeks** (assuming focused effort & successful verification)

---

## Notes

- Notifications system, auth headers, and service role usage are deployed; continue runtime validation.  
- Stripe + AI quota bugs are the main blockers before inviting broader beta testers.  
- Map UX and wholesaler flows remain the biggest UX friction points to address during current QA cycle.
