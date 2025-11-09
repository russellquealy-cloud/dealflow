# Off Axis Deals - Project Status Report
**Generated:** November 8, 2025  
**Last Updated:** November 8, 2025

## Overall Completion: **~78%**

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

### 🏠 Listings Management & Map: **72%**
- ✅ Create / edit / delete listings (wholesalers)
- ✅ View listings (all users) with filters
- ✅ Listing detail page + media gallery
- ✅ Featured listings (including map/star styling)
- ✅ Polygon draw & persistence
- ⚠️ Search autocomplete connects but misses recentering UX polish
- ⚠️ Map flicker reduced but still noticeable under heavy marker redraws
- ✅ My Listings management view

**Issues:**
- Map viewport height good, but drawn shapes still briefly disappear on dataset refresh
- Need final pass on search UX + mobile map layout breathing room

---

### 💰 Payments & Subscriptions: **75%**
- ✅ Stripe integration end-to-end
- ✅ Pricing page + tier gating
- ✅ Billing history + plan metadata
- ⚠️ Upgrade checkout fails when both `customer` & `customer_email` sent
- ⚠️ Usage tracking per plan exists but quota resets not automated

**Issues:**
- Investor Basic → Pro upgrade blocked by Stripe parameter conflict
- Monthly AI allowance logic needs enforcement + admin override tooling

---

### 💬 Messaging: **68%**
- ✅ Conversation list (with fallback when view missing)
- ✅ Message send/receive with RLS
- ✅ Unread badge in header
- ⚠️ Notification hookup for message events partially complete
- ⚠️ Wholesaler read-only rules not enforced everywhere

**Issues:**
- RLS still failing for some investor watchlist/message writes (401/500 reports)
- Need regression sweep for auth headers on all message endpoints

---

### 🔔 Notifications & Alerts: **70%**
- ✅ Supabase tables + RLS for preferences & notifications
- ✅ API routes: preferences, list, unread count
- ✅ Settings UI with optimistic toggles
- ✅ In-app notifications page + header badge
- ⚠️ Event wiring missing for several flows (repair estimate, performance, etc.)
- ⚠️ Email delivery not re-validated after schema changes

**Issues:**
- Need job/helpers connected for market trend, verification, subscription renewal, feedback
- Confirm service role client available in every environment

---

### 🛠️ Tools & Insights: **60%**
- ✅ Investor & wholesaler analyzers (mock responses clarified)
- ✅ Watchlists UI
- ✅ Saved searches UI
- ⚠️ Saved search creation throws 500 for some investors (RLS)
- ⚠️ AI quotas: plan allowances not enforced; test accounts should be unlimited
- ❌ Advanced analytics dashboard still pending

**Issues:**
- Supabase policies need review for saved searches & watchlists
- AI usage counters must respect tiers + monthly reset

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
2. **Saved Search / Watchlist RLS Errors** 🔴  
   Investors receive 500s due to missing auth context / policies.
3. **AI Usage Limits** 🔴  
   Wholesaler/Investor accounts blocked despite intended allowances; quotas need enforcement + reset logic.
4. **Wholesaler Post Deal Loop** 🟠  
   Posting a deal bounces users back to login; high impact on supply.

---

## High Priority Follow-Ups

1. Map flicker + drawn shape persistence polish.
2. Search autocomplete recenter + UX updates (filter-driven save flow).
3. Notification event wiring for all specified triggers.
4. Messaging RLS audit plus wholesaler read-only guardrails.

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
2. Resolve Supabase RLS for watchlists & saved searches; confirm bearer tokens everywhere.  
3. Implement AI usage quota service (per tier + monthly reset + test exemptions).  
4. Fix wholesaler Post Deal redirect loop + finalize My Listings form spacing.  
5. Map polish: preserve drawn areas, smooth marker updates, improve search save UX.  
6. Wire remaining notification triggers + exercise email delivery.  
7. Regression test messaging endpoints + add integration tests where feasible.  

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
