# Release Checklist
**Last Updated:** 2025-01-XX  
**Status:** 🟡 IN PROGRESS

## Pre-Release Verification

### ✅ Domain Configuration
- [ ] `offaxisdeals.com` attached to Vercel project
- [ ] `www.offaxisdeals.com` attached to Vercel project
- [ ] DNS A/CNAME records configured correctly
- [ ] `NEXT_PUBLIC_SITE_URL` set in Vercel environment variables
- [ ] SSL certificates active (automatic via Vercel)

**Verification:**
```bash
npm run vercel:verify-domain
```

### ✅ Environment Variables Matrix

| Variable | Required | Production Value | Status |
|----------|----------|------------------|--------|
| `NEXT_PUBLIC_SITE_URL` | ✅ Yes | `https://www.offaxisdeals.com` | [ ] |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | (Supabase project URL) | [ ] |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | (Supabase anon key) | [ ] |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | (Supabase service role key) | [ ] |
| `STRIPE_SECRET_KEY` | ✅ Yes | (Stripe production key) | [ ] |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ Yes | (Stripe publishable key) | [ ] |
| `STRIPE_WEBHOOK_SECRET` | ✅ Yes | (Stripe webhook secret) | [ ] |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | ✅ Yes | (Google Maps API key) | [ ] |
| `EMAIL_SMTP_HOST` | ✅ Yes | (SMTP host) | [ ] |
| `EMAIL_SMTP_PORT` | ✅ Yes | `587` | [ ] |
| `EMAIL_SMTP_USER` | ✅ Yes | (SMTP username) | [ ] |
| `EMAIL_SMTP_PASS` | ✅ Yes | (SMTP password) | [ ] |
| `EMAIL_FROM` | ✅ Yes | `Customer Service <customerservice@offaxisdeals.com>` | [ ] |
| `CRON_SECRET` | ⚠️ Optional | (For cron job security) | [ ] |
| `VERCEL_TOKEN` | ⚠️ Dev only | (For scripts) | [ ] |
| `VERCEL_PROJECT_ID` | ⚠️ Dev only | (For scripts) | [ ] |

**Verification:**
```bash
curl https://www.offaxisdeals.com/api/health
```

Expected response: `{ "ok": true, "env": { "siteUrl": true, "stripe": {...}, "supabase": {...}, "maps": true, "email": true } }`

### ✅ Stripe Configuration

- [ ] Production Stripe account activated
- [ ] Products and prices created (use `npm run stripe:bootstrap`)
- [ ] Webhook endpoint configured: `https://www.offaxisdeals.com/api/stripe/webhook`
- [ ] Webhook events subscribed:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- [ ] Test checkout flow (Basic monthly/yearly, Pro monthly/yearly)
- [ ] Test customer portal access
- [ ] Verify webhook signature validation works

**Test Steps:**
1. Go to `/pricing`
2. Click "Basic Monthly" → Should redirect to Stripe Checkout
3. Complete test payment (use Stripe test card: `4242 4242 4242 4242`)
4. Verify webhook received and processed
5. Check user profile updated in Supabase (`tier`, `segment`, `active_price_id`)

### ✅ Email Configuration

- [ ] SMTP credentials verified
- [ ] Test email sent successfully (`POST /api/email/test`)
- [ ] Contact form sends to `customerservice@offaxisdeals.com`
- [ ] Feedback form sends to `customerservice@offaxisdeals.com`
- [ ] Daily digest cron job configured (Vercel Cron: `0 9 * * *`)
- [ ] Email links use `NEXT_PUBLIC_SITE_URL` (not relative URLs)

**Test Steps:**
1. As admin, POST to `/api/email/test`
2. Submit contact form → Verify email received
3. Submit feedback form → Verify email received
4. Wait for daily cron → Verify digest emails sent

### ✅ Map Performance

- [ ] No flicker on pan/zoom (visual test)
- [ ] Map loads without SSR (dynamic import with `ssr: false`)
- [ ] Markers cluster correctly
- [ ] Polygon draw search works
- [ ] Bounds debounced to 500ms
- [ ] Container has `minWidth: 0` to prevent layout thrash

**Test Steps:**
1. Navigate to `/listings`
2. Pan map → Should be smooth, no flicker
3. Zoom in/out → Should be smooth
4. Draw polygon → Should filter listings within polygon
5. Check browser console → No excessive re-renders

**Performance Targets:**
- LCP < 2.5s on 4G
- CLS < 0.1
- TBT < 200ms

### ✅ Search & Filters

- [ ] All filters work: price, beds, baths, sqft, property type, status, keywords
- [ ] Polygon draw search works
- [ ] Saved searches work (create, update, delete, apply)
- [ ] Infinite scroll works (if implemented)
- [ ] Scroll position maintained when opening/closing listing detail
- [ ] Keyboard navigation works
- [ ] No layout shifts (CLS < 0.1)

**Test Steps:**
1. Apply filters → Verify listings filtered
2. Draw polygon → Verify spatial search
3. Save search → Verify saved in database
4. Apply saved search → Verify filters applied
5. Scroll list → Verify no layout shifts

### ✅ Posting Flow

- [ ] One-screen quick post form works
- [ ] Address autocomplete works
- [ ] Lat/lng auto-extracted from address
- [ ] Drag-drop image upload works
- [ ] Upload progress shown
- [ ] Retry on upload failure works
- [ ] Required field validation works
- [ ] Inline errors shown
- [ ] Images stored in Supabase Storage

**Test Steps:**
1. As wholesaler, go to create listing page
2. Fill form with address → Verify autocomplete
3. Upload images → Verify progress and success
4. Submit → Verify listing created
5. Check listing detail → Verify images visible

### ✅ Profiles & Roles

- [ ] Profile fields shown based on role (Investor vs Wholesaler)
- [ ] RLS policies enforced
- [ ] Owners can edit their listings
- [ ] Only admins can feature listings
- [ ] Investors cannot edit others' listings
- [ ] Server-side guards in place (no client-only role checks)

**Test Steps:**
1. As investor → Verify correct fields shown
2. As wholesaler → Verify correct fields shown
3. Try to edit another user's listing → Should be blocked
4. As admin → Verify can feature listings

### ✅ Transactions & Close Tracking

- [ ] `transactions` table created
- [ ] `repair_inputs` table created
- [ ] RLS policies working
- [ ] Both parties can confirm transaction
- [ ] `both_confirmed_at` set automatically when both confirm
- [ ] Admin dashboard shows aggregate stats
- [ ] Privacy: no personal info shown by default

**Test Steps:**
1. Mark listing as "Closed"
2. Create transaction → Verify created
3. Wholesaler confirms → Verify `wholesaler_confirmed = true`
4. Investor confirms → Verify `both_confirmed_at` set
5. Check admin dashboard → Verify stats visible

### ✅ Promo Cap Logic

- [ ] `promo_redemptions` table created
- [ ] First 25 per state per role logic works
- [ ] Waitlist shown when cap reached
- [ ] Admin can reset/increase caps
- [ ] Auto-apply 1-month Pro trial coupon at checkout

**Test Steps:**
1. As new user in state X → Verify promo available
2. Redeem 25 times → Verify cap reached
3. Next user → Verify waitlist shown
4. As admin → Verify can reset cap

### ✅ E2E Tests

- [ ] Cypress tests pass:
  - [ ] Auth flows (sign up, login, logout)
  - [ ] Posting flow (as wholesaler)
  - [ ] Search/filter/draw polygon
  - [ ] Stripe checkout (Basic/Pro)
  - [ ] Email send (feedback form)
  - [ ] Role permissions
- [ ] Playwright tests pass:
  - [ ] Map pan/zoom stability (no flicker)
  - [ ] Visual regression tests
- [ ] All tests run in CI

**Run Tests:**
```bash
npm run test:e2e
```

### ✅ Lighthouse CI

- [ ] Lighthouse CI configured
- [ ] Performance ≥ 85
- [ ] Accessibility ≥ 95
- [ ] Best Practices ≥ 95
- [ ] SEO ≥ 90
- [ ] PWA pass on web
- [ ] Bundle size check: no page > 200KB gz

**Run Lighthouse:**
```bash
npm run lighthouse:ci
```

### ✅ Database Migrations

- [ ] All migrations applied in production
- [ ] `stripe_webhook_events` table exists
- [ ] `saved_searches` table has `polygon_geojson` column
- [ ] `transactions` table exists
- [ ] `repair_inputs` table exists
- [ ] `promo_redemptions` table exists (if implemented)
- [ ] RLS policies enabled and tested
- [ ] Indexes created for performance

**Verify:**
```sql
-- Run in Supabase SQL Editor
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('stripe_webhook_events', 'saved_searches', 'transactions', 'repair_inputs');
```

### ✅ Mobile Apps (Future)

- [ ] Expo app skeleton created (`/apps/mobile`)
- [ ] Feature parity checklist documented
- [ ] Shared types library (`/packages/shared`)
- [ ] App Store assets prepared
- [ ] Play Store assets prepared
- [ ] Privacy labels prepared

**Status:** ⏳ Not started

---

## Post-Release Monitoring

### First 24 Hours
- [ ] Monitor error rates (target: < 0.1%)
- [ ] Monitor Stripe webhook success rate (target: > 99%)
- [ ] Monitor email delivery rate (target: > 95%)
- [ ] Monitor map load times (target: < 2.5s LCP)
- [ ] Check Vercel deployment logs for errors
- [ ] Monitor Supabase performance metrics

### First Week
- [ ] Review user feedback
- [ ] Fix critical bugs (P0)
- [ ] Monitor crash-free sessions (target: ≥ 99.5%)
- [ ] Review analytics: signups, conversions, engagement
- [ ] Check saved searches and daily digest delivery

### First Month
- [ ] Review transaction data quality
- [ ] Analyze ARV/MAO model training input quality
- [ ] Review customer service follow-ups
- [ ] Plan next feature priorities

---

## Rollback Plan

If critical issues are found:

1. **Immediate Rollback:**
   ```bash
   # In Vercel Dashboard
   # Go to Deployments → Previous deployment → Promote to Production
   ```

2. **Database Rollback:**
   - Document all migrations applied
   - Create rollback SQL scripts for each migration
   - Test rollback in staging first

3. **Feature Flags:**
   - Use feature flags for risky features
   - Disable feature if issues found
   - Re-enable after fix

---

## Next Actions

1. [ ] Run `npm run vercel:verify-domain` and fix any issues
2. [ ] Run `npm run stripe:bootstrap` and add price IDs to Vercel
3. [ ] Test all critical paths manually
4. [ ] Run E2E tests and fix failures
5. [ ] Run Lighthouse CI and fix failures
6. [ ] Apply all database migrations
7. [ ] Configure Vercel Cron for daily digest
8. [ ] Deploy to production
9. [ ] Monitor first 24 hours closely

---

**Last Updated:** 2025-01-XX  
**Next Review:** After all items checked
