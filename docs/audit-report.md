# Architecture & Ownership Report
**Generated:** 2025-01-XX  
**Status:** 🟡 IN PROGRESS - Core features working, critical improvements needed

## Executive Summary

**Pass/Fail Status:**
- ✅ **Domain**: PASS (using NEXT_PUBLIC_APP_URL, needs Vercel dashboard config)
- 🟡 **APIs**: PARTIAL (health endpoint missing, some endpoints need work)
- 🟡 **Stripe buttons**: PARTIAL (UI exists, needs price ID validation)
- 🟡 **Webhooks**: PARTIAL (exists but needs idempotency, uses wrong Supabase import)
- ✅ **Email**: PASS (SMTP implemented, needs test route)
- 🟡 **Map flicker**: PARTIAL (flicker issues reported, needs refactor)
- 🟡 **Search+Filters+Draw**: PARTIAL (basic filters work, polygon draw incomplete)
- 🟡 **Posting flow**: PARTIAL (exists but needs polish)
- ✅ **Profiles+Roles**: PASS (RLS working)
- ❌ **Promo caps**: FAIL (not implemented)
- ❌ **Transactions tracking**: FAIL (schema missing)
- ❌ **Follow-ups**: FAIL (not implemented)
- ❌ **E2E**: FAIL (no tests)
- ❌ **Lighthouse**: FAIL (no CI)
- ❌ **Expo app**: FAIL (not started)

---

## 1. Working Properly ✅

### Authentication & Profiles
- **Location**: `app/supabase/client.ts`, `app/lib/supabase/server.ts`
- **Status**: ✅ Working
- **Details**: Supabase auth working with SSR-safe client/server split. RLS policies enforced. Profile management functional.

### Core Listings Features
- **Location**: `app/listings/page.tsx`, `app/components/GoogleMapComponent.tsx`
- **Status**: ✅ Working
- **Details**: Basic CRUD operations, map display, filtering, search all functional.

### Email Service
- **Location**: `app/lib/email.ts`
- **Status**: ✅ Working
- **Details**: SMTP implementation using nodemailer. Environment variables configured. Missing test route.

### Domain Configuration
- **Location**: `env.example`, `docs/vercel-domain-setup.md`
- **Status**: ✅ Working
- **Details**: NEXT_PUBLIC_APP_URL used throughout. Documentation exists. Needs Vercel dashboard configuration.

---

## 2. Needs Improvement 🟡

### Supabase Client/Server Split
- **Location**: Multiple files
- **Issue**: Guardrails specify `lib/supabaseClient.ts` and `lib/createSupabaseServer.ts`, but code uses:
  - `app/supabase/client.ts` (browser, SSR-safe ✅)
  - `app/lib/supabase/server.ts` (server, SSR-safe ✅)
  - `lib/supabase.ts` (legacy, not SSR-safe ❌)
  - `app/lib/client.ts` (duplicate browser client, not SSR-safe ❌)
- **Fix Required**: Consolidate to guardrail-specified paths or update guardrails.
- **Risk**: Low (current implementation works, but inconsistent with standards)
- **ETA**: 1 day

### Stripe Integration
- **Location**: `app/api/stripe/webhook/route.ts`, `app/api/billing/create-checkout-session/route.ts`
- **Issue**: 
  - Webhook uses wrong Supabase import path (`@/lib/supabase/server` should be `lib/createSupabaseServer`)
  - No idempotency handling
  - No retry-safe updates
  - Missing profile update on subscription creation
- **Fix Required**: 
  - Fix import paths
  - Add idempotency keys
  - Add atomic transaction handling
  - Update profiles table on subscription events
- **Risk**: High (payments failing)
- **ETA**: 2 days

### Map Flickering
- **Location**: `app/components/GoogleMapComponent.tsx`
- **Issue**: Flicker reported on pan/zoom. Component re-renders too frequently.
- **Fix Required**:
  - Move to dynamic import with `ssr: false`
  - Memoize markers and clusterer
  - Debounce bounds changes (300-500ms)
  - Fix container minWidth: 0 to prevent layout thrash
  - Prevent re-mount on route changes
- **Risk**: Medium (UX issue)
- **ETA**: 2 days

### Search & Filters
- **Location**: `app/components/FiltersBar.tsx`, `app/listings/page.tsx`
- **Issue**: 
  - Basic filters work but no URL persistence
  - No polygon draw search implementation
  - No saved searches
  - No infinite scroll
- **Fix Required**:
  - Add URL query params for filters
  - Implement polygon draw using Google Maps Drawing Library
  - Add saved_searches table and UI
  - Implement infinite scroll with skeletons
- **Risk**: Medium (feature completeness)
- **ETA**: 3 days

---

## 3. Implemented But Not Wired in UI ⚠️

### AI Analyzer Component
- **Location**: `app/components/AIAnalyzer.tsx`, `app/lib/ai-analyzer.ts`
- **Status**: Component exists but non-functional
- **Issue**: No API integration, no OpenAI/Anthropic calls working
- **Fix Required**: Wire up API routes, add environment variables
- **ETA**: 2 days

### Admin Dashboard
- **Location**: `app/admin/page.tsx`
- **Status**: UI exists but limited functionality
- **Issue**: Missing analytics, feedback, support features
- **Fix Required**: Wire up backend data
- **ETA**: 3 days

### Watchlists & Alerts
- **Location**: `app/components/WatchlistButton.tsx`, `app/alerts/page.tsx`
- **Status**: Components exist
- **Issue**: Basic functionality but missing email digest
- **Fix Required**: Add daily digest email
- **ETA**: 1 day

---

## 4. Started But Not Implemented 🟡

### Polygon Draw Search
- **Location**: `app/components/GoogleMapComponent.tsx` (partial)
- **Status**: Drawing library loaded but not fully implemented
- **Issue**: `onPolygonComplete` callback exists but no GeoJSON storage or query
- **Fix Required**: 
  - Store polygon as GeoJSON in saved_searches
  - Query listings intersecting polygon using PostGIS
- **ETA**: 2 days

### Posting Flow
- **Location**: `app/post/page.tsx`, `app/components/CreateListingForm.tsx`
- **Status**: Basic form exists
- **Issue**: 
  - No drag-drop image upload
  - No progress indicator
  - No retry logic
  - No address autocomplete polish
- **Fix Required**: Add image upload with progress, retry, address autocomplete
- **ETA**: 2 days

---

## 5. Missing and Required for Release ❌

### Health API Endpoint
- **Location**: Missing - needs `app/api/health/route.ts`
- **Status**: ❌ Not implemented
- **Required**: Return `{ ok: true, env: { siteUrl, stripe, supabase, maps, email } }` with boolean flags only
- **ETA**: 0.5 days

### Email Test Route
- **Location**: Missing - needs `app/api/email/test/route.ts`
- **Status**: ❌ Not implemented
- **Required**: Admin-gated route to send test email
- **ETA**: 0.5 days

### Stripe Bootstrap Script
- **Location**: Missing - needs `scripts/stripe-bootstrap.ts`
- **Status**: ❌ Not implemented
- **Required**: Validate/create product/price IDs, output configuration
- **ETA**: 1 day

### Vercel Domain Verification Script
- **Location**: Missing - needs `scripts/vercel-verify-domain.ts`
- **Status**: ❌ Not implemented
- **Required**: Use Vercel API to verify/add domains, print DNS config
- **ETA**: 1 day

### Promo Cap Logic (First 25/State/Role)
- **Location**: Missing - needs schema and logic
- **Status**: ❌ Not implemented
- **Required**: 
  - `promo_redemptions` table with composite key (state, role)
  - Server logic to check count < 25
  - Auto-apply trial coupon at checkout
  - Admin view to reset caps
- **ETA**: 2 days

### Transactions & Repair Inputs Schema
- **Location**: Missing - needs migrations
- **Status**: ❌ Not implemented
- **Required**:
  - `transactions` table: listing_id, wholesaler_id, investor_id, close_date, close_price, etc.
  - `repair_inputs` table: normalized checklist per listing
  - Confirmation flow for closed deals
  - Admin dashboards for ARV/MAO training
- **ETA**: 3 days

### Customer Service Follow-ups
- **Location**: Missing - needs cron job
- **Status**: ❌ Not implemented
- **Required**:
  - Supabase cron or Vercel Cron to run monthly
  - Email wholesalers about service quality
  - Email investors about outcomes
  - Write responses to feedback table
- **ETA**: 2 days

### E2E Tests (Cypress + Playwright)
- **Location**: Missing - needs test suites
- **Status**: ❌ Not implemented
- **Required**:
  - Auth flows
  - Posting flow
  - Search/filter/draw
  - Stripe checkout
  - Email send
  - Role permissions
  - Map pan/zoom stability
- **ETA**: 5 days

### Lighthouse CI
- **Location**: Missing - needs config
- **Status**: ❌ Not implemented
- **Required**:
  - Targets: Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90
  - Core Web Vitals: LCP < 2.5s, CLS < 0.1, TBT < 200ms
  - Bundle guard: report pages > 200KB gz
- **ETA**: 2 days

### Expo Mobile App
- **Location**: Missing - needs `/apps/mobile`
- **Status**: ❌ Not started
- **Required**:
  - Expo React Native project
  - expo-router setup
  - Google Maps SDK
  - Polygon draw parity
  - Shared business logic via `/packages/shared`
  - Feature parity: map, search, filters, draw, listing detail, post flow, saved searches, watchlist, notifications
- **ETA**: 2-3 weeks

---

## Risk List with Fixes

### High Risk 🔴

1. **Stripe Webhook Import Path**
   - **Risk**: Webhook may fail to update subscriptions
   - **Fix**: Update `app/api/stripe/webhook/route.ts` import from `@/lib/supabase/server` to correct path
   - **File**: `app/api/stripe/webhook/route.ts:5`
   - **ETA**: 0.5 days

2. **Missing Profile Updates on Subscription**
   - **Risk**: User profiles not updated when subscription changes
   - **Fix**: Add profile update logic in webhook handlers
   - **File**: `app/api/stripe/webhook/route.ts`
   - **ETA**: 1 day

3. **No Idempotency in Webhooks**
   - **Risk**: Duplicate webhook events cause data corruption
   - **Fix**: Add idempotency keys and deduplication
   - **File**: `app/api/stripe/webhook/route.ts`
   - **ETA**: 1 day

### Medium Risk 🟡

4. **Map Flickering**
   - **Risk**: Poor UX, user complaints
   - **Fix**: Refactor map component per guardrails
   - **File**: `app/components/GoogleMapComponent.tsx`
   - **ETA**: 2 days

5. **Multiple Supabase Client Instances**
   - **Risk**: Inconsistent behavior, potential SSR issues
   - **Fix**: Consolidate to guardrail-specified paths
   - **Files**: `lib/supabase.ts`, `app/lib/client.ts`
   - **ETA**: 1 day

6. **Missing Environment Variable Validation**
   - **Risk**: Runtime errors in production
   - **Fix**: Add health endpoint and startup validation
   - **File**: `app/api/health/route.ts`
   - **ETA**: 0.5 days

### Low Risk 🟢

7. **No URL Persistence for Filters**
   - **Risk**: User experience friction
   - **Fix**: Add query params
   - **File**: `app/listings/page.tsx`
   - **ETA**: 1 day

8. **Missing Saved Searches**
   - **Risk**: Feature gap
   - **Fix**: Implement saved_searches table and UI
   - **ETA**: 2 days

---

## Dead Imports & Unused Files

### Dead Imports Detected
- `app/components/HeaderClient.tsx:24` - `event` parameter unused (but needed for type)
- `app/api/messages/conversations/route.ts:4` - `request` parameter unused
- `app/api/messages/unread-count/route.ts:4` - `request` parameter unused
- `app/auth/signout/route.ts:62` - `e` parameter unused
- `app/login/page.tsx:11` - `router` unused
- `app/login/page.tsx:64` - `err` unused
- `app/my-listings/page.tsx:6` - `ListingCard` unused
- `app/supabase/client.ts:49` - `hostname` unused
- `app/supabase/client.ts:70,78` - `error` unused (intentional silent fail)
- `app/supabase/client.ts:104` - `session` unused (but needed for type)
- `app/terms/page.tsx:2` - `Image` unused

### Unused Files (Placeholders/Empty)
- `app/debug/` - Empty directory
- `app/debug-filterbar/` - Empty directory
- `app/debug-filters/` - Empty directory
- `app/debug-listings/` - Empty directory
- `app/debug-supabase/` - Empty directory
- `app/test-data/` - Empty directory
- `app/test-simple/` - Empty directory
- `app/account-new/` - Empty directory (replaced by `account/`)
- `pages/api/` - Empty directory

### Conflicting Libraries
- Tailwind CSS installed but guardrails say "No Tailwind" - Some components use Tailwind classes
- Multiple Supabase client implementations (see Supabase split section)

---

## File Paths for Fixes

### Critical Fixes
1. `app/components/Header.tsx` - ✅ FIXED (TypeScript error)
2. `app/api/stripe/webhook/route.ts` - Fix import path, add idempotency
3. `app/api/health/route.ts` - CREATE NEW
4. `app/api/email/test/route.ts` - CREATE NEW
5. `app/components/GoogleMapComponent.tsx` - Refactor to eliminate flicker

### Infrastructure
6. `scripts/vercel-verify-domain.ts` - CREATE NEW
7. `scripts/stripe-bootstrap.ts` - CREATE NEW
8. `.env.template` - CREATE NEW (from env.example)
9. `lib/supabaseClient.ts` - CREATE NEW (consolidate browser client)
10. `lib/createSupabaseServer.ts` - CREATE NEW (consolidate server client)

### Features
11. `supabase/sql/create_promo_redemptions.sql` - CREATE NEW
12. `supabase/sql/create_transactions.sql` - CREATE NEW
13. `supabase/sql/create_repair_inputs.sql` - CREATE NEW
14. `app/components/PolygonDrawSearch.tsx` - CREATE NEW
15. `app/lib/promo-caps.ts` - CREATE NEW

---

## Open Issues List

| Issue | Owner | Priority | ETA | Status |
|-------|-------|----------|-----|--------|
| Fix Stripe webhook import path | Dev | High | 0.5d | 🔴 Open |
| Add idempotency to webhooks | Dev | High | 1d | 🔴 Open |
| Fix map flickering | Dev | Medium | 2d | 🟡 Open |
| Create health endpoint | Dev | Medium | 0.5d | 🟡 Open |
| Consolidate Supabase clients | Dev | Medium | 1d | 🟡 Open |
| Implement polygon draw search | Dev | Medium | 2d | 🟡 Open |
| Add promo cap logic | Dev | Low | 2d | 🟢 Open |
| Add transactions schema | Dev | Low | 3d | 🟢 Open |
| Add E2E tests | QA | Medium | 5d | 🟡 Open |
| Setup Lighthouse CI | DevOps | Medium | 2d | 🟡 Open |
| Create Expo app | Mobile | Low | 2-3w | 🟢 Open |

---

## Next Steps

1. **Immediate (This Week)**:
   - Fix Stripe webhook import path and add idempotency
   - Create health and email test endpoints
   - Fix TypeScript build errors (DONE)

2. **Short Term (Next 2 Weeks)**:
   - Refactor map component to eliminate flicker
   - Implement polygon draw search
   - Add saved searches and email digest
   - Polish posting flow with image upload

3. **Medium Term (Next Month)**:
   - Add promo cap logic
   - Implement transactions tracking
   - Add E2E test suite
   - Setup Lighthouse CI

4. **Long Term (Future)**:
   - Build Expo mobile app
   - Implement customer service follow-ups
   - Add advanced analytics

---

**Last Updated**: 2025-01-XX  
**Review Status**: Awaiting stakeholder approval

