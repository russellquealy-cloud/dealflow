# Off Axis Deals - Security & Access Control Audit Report

**Date:** November 19, 2025  
**Tech Stack:** Next.js 15 (App Router), TypeScript, Supabase (auth + DB), Stripe (subscriptions), Vercel  
**Audit Type:** Static Code Analysis - Full Web Sweep

---

## 1. User & Role Model / Subscription Model

### User & Role Model

**Storage Location:**
- Primary: `profiles` table in Supabase
- Fields: `role`, `segment`, `tier`, `membership_tier`
- Auth: `auth.users` table (Supabase Auth)

**Role Values:**
- `'investor'` - Investor users
- `'wholesaler'` - Wholesaler users  
- `'admin'` - Admin users (can be in either `role` or `segment` field)

**Key Files:**
- `app/lib/admin.ts` - Admin check helpers (`isAdmin()`, `checkIsAdminClient()`)
- `app/lib/auth/server.ts` - Server-side auth (`getAuthUser()`, `getSupabaseServer()`)
- `app/providers/AuthProvider.tsx` - Client-side auth context (`useAuth()` hook)
- `app/supabase/client.ts` - Browser Supabase client (PKCE flow)
- `lib/createSupabaseServer.ts` - Server Supabase client creator

**Auth Check Functions:**
- **Server-side:** `getAuthUser(request)` - Returns `{ user, supabase }` or `{ user: null, supabase }`
- **Client-side:** `useAuth()` hook - Returns `{ session, loading, refreshSession }`
- **Admin check:** `isAdmin(userId, supabaseClient)` - Checks `profiles.role === 'admin' || profiles.segment === 'admin'`

### Subscription Model

**Storage Location:**
- `subscriptions` table - Stripe subscription records
- `profiles.tier` - Legacy tier field
- `profiles.membership_tier` - Current tier field
- RPC function: `get_user_subscription_tier(user_uuid)` - Returns computed tier

**Subscription Tiers:**
- `'FREE'` - Free tier (default)
- `'INVESTOR_BASIC'` - Investor Basic ($29/month)
- `'INVESTOR_PRO'` - Investor Pro ($59/month)
- `'WHOLESALER_BASIC'` - Wholesaler Basic ($49/month)
- `'WHOLESALER_PRO'` - Wholesaler Pro ($99/month)

**Key Files:**
- `app/lib/stripe.ts` - Stripe integration, tier definitions (`STRIPE_PLANS`)
- `app/lib/subscription.ts` - Subscription helpers:
  - `getUserSubscriptionTier(userId, client?)` - Returns `SubscriptionTier`
  - `getPlanLimits(tier)` - Returns plan limits (contacts, ai_analyses, listings)
  - `canUserPerformAction(userId, actionType, actionCount, client?)` - Checks quota
  - `getUserUsage(userId, client?)` - Gets current month usage
- `app/lib/analytics/proGate.ts` - Pro tier checks (`isInvestorPro()`, `isWholesalerPro()`)

**Subscription Check Pattern:**
```typescript
const tier = await getUserSubscriptionTier(user.id, supabase);
const limits = getPlanLimits(tier);
const canPerform = await canUserPerformAction(user.id, 'ai_analyses', 1, supabase);
```

---

## 2. Route-Level Gating (UI)

| Route/Path | File | Purpose | Current Auth Requirement | Current Role Requirement | Current Subscription Requirement |
|------------|------|---------|-------------------------|--------------------------|----------------------------------|
| `/` | `app/page.tsx` | Homepage/Welcome | None (public) | None | None |
| `/login` | `app/login/page.tsx` | Login page | None (redirects if logged in) | None | None |
| `/signup` | `app/signup/page.tsx` | Signup page | None | None | None |
| `/reset-password` | `app/reset-password/page.tsx` | Password reset | None (token-based) | None | None |
| `/auth/callback` | `app/auth/callback/page.tsx` | Auth callback handler | None (handles auth) | None | None |
| `/listings` | `app/listings/page.tsx` | Browse listings | None (public) | None | None |
| `/listing/[id]` | `app/listing/[id]/page.tsx` | Listing detail | None (public) | None | Contact info gated by subscription |
| `/watchlists` | `app/watchlists/page.tsx` | User watchlist | **Client-side check** (`useAuth()`) | None | None |
| `/my-listings` | `app/my-listings/page.tsx` | Wholesaler's listings | **Client-side check** (`useAuth()`) | None (but should be wholesaler) | None |
| `/my-listings/new` | `app/my-listings/new/page.tsx` | Create listing | **Client-side redirect** to `/login` if no session | None (but should be wholesaler) | None |
| `/post` | `app/post/page.tsx` | Post listing (legacy?) | **Client-side check** (`useAuth()`) | None (but should be wholesaler) | None |
| `/messages` | `app/messages/page.tsx` | Messages list | **Client-side check** (`useAuth()`) | None | None |
| `/messages/[listingId]` | `app/messages/[listingId]/page.tsx` | Message thread | **Client-side check** (`useAuth()`) | None | None |
| `/account` | `app/account/page.tsx` | User account page | **Client-side check** (`useAuth()`) | None | Shows tier info |
| `/profile` | `app/profile/page.tsx` | Profile page | **Server-side** (likely) | None | None |
| `/settings` | `app/settings/page.tsx` | Settings page | **Client-side check** (`useAuth()`) | None | None |
| `/settings/notifications` | `app/settings/notifications/page.tsx` | Notification preferences | **Client-side check** (`useAuth()`) | None | None |
| `/billing` | `app/billing/page.tsx` | Billing/subscription | **Client-side check** (`useAuth()`) | None | None |
| `/billing/cancel` | `app/billing/cancel/page.tsx` | Cancel subscription | **Client-side check** (`useAuth()`) | None | None |
| `/pricing` | `app/pricing/page.tsx` | Pricing page | None (public) | None | None |
| `/tools/analyzer` | `app/tools/analyzer/page.tsx` | AI Analyzer tool | **Client-side redirect** to `/login` if no session | Checks role (investor/wholesaler/admin) | None (but should check subscription) |
| `/analytics` | `app/analytics/page.tsx` | Analytics redirect | None (redirects to `/analytics/lead-conversion`) | None | None |
| `/analytics/lead-conversion` | `app/analytics/lead-conversion/page.tsx` | Lead conversion analytics | **Client-side check** (`useAuth()`) | None | **Should be Pro** (has `isProGate` check) |
| `/analytics/export` | `app/analytics/export/page.tsx` | Analytics export | **Client-side check** (`useAuth()`) | None | **Should be Pro** |
| `/analytics/heatmap` | `app/analytics/heatmap/page.tsx` | Geographic heatmap | **Client-side check** (`useAuth()`) | None | **Should be Pro** |
| `/alerts` | `app/alerts/page.tsx` | Saved alerts | **Client-side check** (`useAuth()`) | None | None |
| `/saved-searches` | `app/saved-searches/page.tsx` | Saved searches | **Client-side check** (`useAuth()`) | None | None |
| `/notifications` | `app/notifications/page.tsx` | Notifications list | **Client-side check** (`useAuth()`) | None | None |
| `/admin` | `app/admin/page.tsx` | Admin dashboard | **Client-side check** (`useAuth()`) | **Client-side check** (`checkIsAdminClient()`) | None |
| `/admin/users` | `app/admin/users/page.tsx` | User management | **Layout check** (no redirect) | **Layout check** (no redirect) | None |
| `/admin/flags` | `app/admin/flags/page.tsx` | Content flags | **Layout check** (no redirect) | **Layout check** (no redirect) | None |
| `/admin/audit-logs` | `app/admin/audit-logs/page.tsx` | Audit logs | **Layout check** (no redirect) | **Layout check** (no redirect) | None |
| `/admin/ai-usage` | `app/admin/ai-usage/page.tsx` | AI usage stats | **Layout check** (no redirect) | **Layout check** (no redirect) | None |
| `/admin/analytics` | `app/admin/analytics/page.tsx` | Admin analytics | **Layout check** (no redirect) | **Layout check** (no redirect) | None |
| `/admin/reports` | `app/admin/reports/page.tsx` | Reports | **Layout check** (no redirect) | **Layout check** (no redirect) | None |
| `/admin/alerts` | `app/admin/alerts/page.tsx` | Admin alerts | **Layout check** (no redirect) | **Layout check** (no redirect) | None |
| `/admin/support` | `app/admin/support/page.tsx` | Support tools | **Layout check** (no redirect) | **Layout check** (no redirect) | None |
| `/admin/feedback` | `app/admin/feedback/page.tsx` | Feedback review | **Layout check** (no redirect) | **Layout check** (no redirect) | None |
| `/admin/watchlists` | `app/admin/watchlists/page.tsx` | Watchlist admin | **Layout check** (no redirect) | **Layout check** (no redirect) | None |
| `/portal/investor` | `app/portal/investor/page.tsx` | Investor portal | **Client-side check** (`useAuth()`) | Should be investor | None |
| `/portal/wholesaler` | `app/portal/wholesaler/page.tsx` | Wholesaler portal | **Client-side check** (`useAuth()`) | Should be wholesaler | None |
| `/welcome` | `app/welcome/page.tsx` | Welcome/onboarding | **Client-side check** (`useAuth()`) | None | None |
| `/contact-sales` | `app/contact-sales/page.tsx` | Contact sales | None (public) | None | None |
| `/terms` | `app/terms/page.tsx` | Terms of service | None (public) | None | None |
| `/privacy` | `app/privacy/page.tsx` | Privacy policy | None (public) | None | None |
| `/disclaimer` | `app/disclaimer/page.tsx` | Disclaimer | None (public) | None | None |
| `/refund-policy` | `app/refund-policy/page.tsx` | Refund policy | None (public) | None | None |
| `/feedback` | `app/feedback/page.tsx` | Feedback form | None (public) | None | None |

**Critical Issues Found:**
1. **Admin routes (`/admin/*`):** Layout checks admin status but **DOES NOT REDIRECT** - non-admins can see the page structure
2. **Wholesaler routes (`/my-listings/*`, `/post`):** No role verification - investors could access
3. **Pro features (`/analytics/*`):** Client-side checks only - can be bypassed
4. **Most routes:** Client-side auth checks only - can be bypassed by direct URL access

---

## 3. API-Level Gating

| API Route | Method | File | Purpose | Auth Check | Role/Subscription Check | Ownership / RLS Notes |
|-----------|--------|------|---------|------------|--------------------------|----------------------|
| `/api/listings` | GET | `app/api/listings/route.ts` | Get listings | Optional (for admin) | Admin can see drafts | Public listings via RLS |
| `/api/listings` | POST | `app/api/listings/route.ts` | Create listing | **Required** (`getUser()`) | None (should be wholesaler) | User becomes owner |
| `/api/listings/polygon-search` | POST | `app/api/listings/polygon-search/route.ts` | Polygon search | Optional | None | Public via RLS |
| `/api/listings.geojson` | GET | `app/api/listings.geojson/route.ts` | GeoJSON export | Optional | None | Public via RLS |
| `/api/watchlists` | GET | `app/api/watchlists/route.ts` | Get watchlist | **Required** (multi-method) | None | User's own watchlist via RLS |
| `/api/watchlists` | POST | `app/api/watchlists/route.ts` | Add to watchlist | **Required** (multi-method) | None | User's own watchlist via RLS |
| `/api/watchlists` | DELETE | `app/api/watchlists/route.ts` | Remove from watchlist | **Required** (multi-method) | None | User's own watchlist via RLS |
| `/api/messages` | GET | `app/api/messages/route.ts` | Get messages | **Required** (`getAuthUser()`) | None | User's own messages via RLS |
| `/api/messages` | POST | `app/api/messages/route.ts` | Send message | **Required** (`getAuthUser()`) | None | User can send to listing owner |
| `/api/messages/conversations` | GET | `app/api/messages/conversations/route.ts` | Get conversations | **Required** (`getAuthUser()`) | None | User's own conversations |
| `/api/messages/unread-count` | GET | `app/api/messages/unread-count/route.ts` | Unread count | **Required** (`getAuthUser()`) | None | User's own messages |
| `/api/analyze` | POST | `app/api/analyze/route.ts` | AI analysis (legacy) | **Required** (`getAuthUser()`) | None | **Checks quota** (`canUserPerformAction`) |
| `/api/analyze-structured` | POST | `app/api/analyze-structured/route.ts` | Structured AI analysis | **Required** (`getAuthUser()`) | **Role check** (investor/wholesaler) | **Checks quota** (`checkAndIncrementAiUsage`) |
| `/api/ai-usage` | GET | `app/api/ai-usage/route.ts` | Get AI usage | **Required** (multi-method) | Admin for user/tier queries | User's own usage |
| `/api/notifications` | GET | `app/api/notifications/route.ts` | Get notifications | **Required** (`getAuthUser()`) | None | User's own notifications |
| `/api/notifications/preferences` | GET/PUT | `app/api/notifications/preferences/route.ts` | Notification prefs | **Required** (`getAuthUser()`) | None | User's own preferences |
| `/api/notifications/unread-count` | GET | `app/api/notifications/unread-count/route.ts` | Unread count | **Required** (`getAuthUser()`) | None | User's own notifications |
| `/api/saved-searches` | GET/POST/DELETE | `app/api/saved-searches/route.ts` | Saved searches | **Required** (`getAuthUser()`) | None | User's own searches |
| `/api/alerts` | GET/POST/DELETE | `app/api/alerts/route.ts` | Alerts | **Required** (`getAuthUser()`) | None | User's own alerts |
| `/api/analytics` | GET | `app/api/analytics/route.ts` | User analytics | **Required** (`getAuthUser()`) | **Pro check** (`isProTier`) | User's own analytics |
| `/api/analytics/export` | GET | `app/api/analytics/export/route.ts` | Export analytics | **Required** (`getAuthUser()`) | **Pro check** (`isProTier`) | User's own analytics |
| `/api/billing/create-checkout-session` | POST | `app/api/billing/create-checkout-session/route.ts` | Stripe checkout | **Required** (`getAuthUser()`) | None | User's own checkout |
| `/api/billing/portal` | POST | `app/api/billing/portal/route.ts` | Stripe portal | **Required** (`getAuthUser()`) | None | User's own portal |
| `/api/billing/webhook` | POST | `app/api/billing/webhook/route.ts` | Stripe webhook | **Signature verification** | None | System webhook |
| `/api/stripe/webhook` | POST | `app/api/stripe/webhook/route.ts` | Stripe webhook (alt) | **Signature verification** | None | System webhook |
| `/api/stripe/checkout` | POST | `app/api/stripe/checkout/route.ts` | Stripe checkout (alt) | **Required** (`getAuthUser()`) | None | User's own checkout |
| `/api/transactions` | GET | `app/api/transactions/route.ts` | Get transactions | **Required** (`getAuthUser()`) | None | User's own transactions |
| `/api/transactions/[id]/confirm` | POST | `app/api/transactions/[id]/confirm/route.ts` | Confirm transaction | **Required** (`getAuthUser()`) | None | User's own transaction |
| `/api/admin/users` | GET/PATCH | `app/api/admin/users/route.ts` | User management | **Required** (`getAuthUser()`) | **Admin check** (`isAdmin()`) | Admin only |
| `/api/admin/flags` | GET/PATCH | `app/api/admin/flags/route.ts` | Content flags | **Required** (`getAuthUser()`) | **Admin check** (`isAdmin()`) | Admin only |
| `/api/admin/diagnose` | GET | `app/api/admin/diagnose/route.ts` | Diagnostics | **Required** (`getAuthUser()`) | **Admin check** (`isAdmin()`) | Admin only |
| `/api/admin/fix-account` | POST | `app/api/admin/fix-account/route.ts` | Fix account | **Required** (`getAuthUser()`) | **Admin check** (`isAdmin()`) | Admin only |
| `/api/diagnostics/email` | POST | `app/api/diagnostics/email/route.ts` | Email diagnostics | **Required** (`getUser()`) | **Admin check** (`isAdmin()`) | Admin only |
| `/api/geocode` | GET/POST | `app/api/geocode/route.ts` | Geocoding | None (public) | None | Public API |
| `/api/health` | GET | `app/api/health/route.ts` | Health check | None (public) | None | Public API |
| `/api/contact-sales` | POST | `app/api/contact-sales/route.ts` | Contact sales | None (public) | None | Public API |
| `/api/feedback` | POST | `app/api/feedback/route.ts` | Submit feedback | None (public) | None | Public API |
| `/api/buyers/match` | GET | `app/api/buyers/match/route.ts` | Match buyers | **Required** (`getAuthUser()`) | Should be wholesaler | Wholesaler's listings |
| `/api/cron/*` | GET | `app/api/cron/*/route.ts` | Cron jobs | **CRON_SECRET** check | None | System only |

**Critical Issues Found:**
1. **`/api/listings` POST:** No role check - investors could create listings
2. **`/api/analyze-structured`:** Role check exists but admin can bypass
3. **`/api/analytics`:** Pro check is client-side only - can be bypassed
4. **Admin APIs:** Properly gated with `isAdmin()` check
5. **Most APIs:** Use `getAuthUser()` which is good, but some lack role/subscription checks

---

## 4. Feature vs Account Level Matrix

| Feature | Route(s) / API(s) | Anonymous | Investor Free | Investor Paid | Wholesaler Free | Wholesaler Paid | Admin | Notes |
|---------|-------------------|-----------|---------------|---------------|------------------|-----------------|-------|-------|
| Browse public listings | `/listings`, `/api/listings` GET | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Public |
| View listing details | `/listing/[id]` | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Public |
| View contact info | `/listing/[id]` | ❌ Blocked | ❌ Blocked | ✅ Allowed (Basic+) | ❌ Blocked | ✅ Allowed (Basic+) | ✅ Allowed | **Gated by subscription** |
| Search & filter | `/listings` | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Public |
| Map view | `/listings` | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Public |
| Save to watchlist | `/api/watchlists` POST | ❌ Blocked | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | **Requires auth** |
| View watchlist | `/watchlists` | ❌ Blocked | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | **Requires auth** |
| Send message to owner | `/api/messages` POST | ❌ Blocked | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | **Requires auth** |
| View messages | `/messages` | ❌ Blocked | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | **Requires auth** |
| Create listing | `/my-listings/new`, `/api/listings` POST | ❌ Blocked | ❌ Blocked | ❌ Blocked | ✅ Allowed | ✅ Allowed | ✅ Allowed | **Should be wholesaler-only** |
| Edit own listing | `/my-listings`, `/api/listings` PATCH | ❌ Blocked | ❌ Blocked | ❌ Blocked | ✅ Allowed | ✅ Allowed | ✅ Allowed | **Should be wholesaler-only** |
| Delete own listing | `/api/listings` DELETE | ❌ Blocked | ❌ Blocked | ❌ Blocked | ✅ Allowed | ✅ Allowed | ✅ Allowed | **Should be wholesaler-only** |
| AI Analysis (Investor) | `/tools/analyzer`, `/api/analyze-structured` | ❌ Blocked | ⚠️ Limited (2/month) | ⚠️ Limited (20-100/month) | ❌ Blocked | ❌ Blocked | ✅ Unlimited | **Quota-based** |
| AI Analysis (Wholesaler) | `/tools/analyzer`, `/api/analyze-structured` | ❌ Blocked | ❌ Blocked | ❌ Blocked | ⚠️ Limited (2/month) | ⚠️ Limited (50-200/month) | ✅ Unlimited | **Quota-based** |
| Analytics dashboard | `/analytics/*`, `/api/analytics` | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ✅ Allowed (Pro) | ✅ Allowed | **Pro-only** |
| Analytics export | `/analytics/export`, `/api/analytics/export` | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ✅ Allowed (Pro) | ✅ Allowed | **Pro-only** |
| Geographic heatmap | `/analytics/heatmap` | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ✅ Allowed (Pro) | ✅ Allowed | **Pro-only** |
| Saved searches | `/saved-searches`, `/api/saved-searches` | ❌ Blocked | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | **Requires auth** |
| Alerts | `/alerts`, `/api/alerts` | ❌ Blocked | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | **Requires auth** |
| View account | `/account` | ❌ Blocked | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | **Requires auth** |
| Manage billing | `/billing`, `/api/billing/*` | ❌ Blocked | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | **Requires auth** |
| Admin dashboard | `/admin/*` | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ✅ Allowed | **Admin-only** |
| Admin user management | `/admin/users`, `/api/admin/users` | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ✅ Allowed | **Admin-only** |
| Admin flags | `/admin/flags`, `/api/admin/flags` | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ✅ Allowed | **Admin-only** |
| Admin audit logs | `/admin/audit-logs` | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ✅ Allowed | **Admin-only** |
| Admin diagnostics | `/api/diagnostics/email` | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ✅ Allowed | **Admin-only** |

**Legend:**
- ✅ Allowed - Feature is accessible
- ❌ Blocked - Feature is not accessible
- ⚠️ Limited - Feature is accessible but with restrictions (quota, read-only, etc.)

---

## 5. Gating Issues (Diff: Intended vs Actual)

| Area | Route/API | Who Should Have Access | Who Currently Has Access | Problem Type | File(s) to Change | Summary of Fix |
|------|-----------|------------------------|---------------------------|--------------|-------------------|----------------|
| **Admin Routes** | `/admin/*` | Admin only | **Anyone** (layout doesn't redirect) | Missing redirect | `app/admin/layout.tsx` | Add server-side redirect for non-admins |
| **Wholesaler Routes** | `/my-listings/*`, `/post` | Wholesalers only | **All authenticated users** | Missing role check | `app/my-listings/page.tsx`, `app/post/page.tsx` | Add role check, redirect investors |
| **Pro Features** | `/analytics/*` | Pro+ users only | **All authenticated users** (client-side check only) | Client-side only | `app/analytics/*/page.tsx`, `app/api/analytics/route.ts` | Add server-side Pro check |
| **Listing Creation** | `/api/listings` POST | Wholesalers only | **All authenticated users** | Missing role check | `app/api/listings/route.ts` | Add role check, return 403 for investors |
| **AI Analysis** | `/api/analyze-structured` | Role-matched users | **Admin can bypass role check** | Admin bypass | `app/api/analyze-structured/route.ts` | Keep admin bypass but document it |
| **Contact Info** | `/listing/[id]` | Paid users only | **Client-side check only** | Client-side only | `app/listing/[id]/page.tsx` | Add server-side subscription check |
| **Watchlist** | `/watchlists` | Authenticated users | **Client-side check only** | Client-side only | `app/watchlists/page.tsx` | Add server-side redirect (or rely on API 401) |
| **Messages** | `/messages/*` | Authenticated users | **Client-side check only** | Client-side only | `app/messages/page.tsx` | Add server-side redirect (or rely on API 401) |
| **Account** | `/account` | Authenticated users | **Client-side check only** | Client-side only | `app/account/page.tsx` | Add server-side redirect (or rely on API 401) |
| **Billing** | `/billing` | Authenticated users | **Client-side check only** | Client-side only | `app/billing/page.tsx` | Add server-side redirect (or rely on API 401) |
| **Tools/Analyzer** | `/tools/analyzer` | Authenticated users | **Client-side redirect** | Client-side only | `app/tools/analyzer/page.tsx` | Add server-side redirect |
| **Analytics Export** | `/api/analytics/export` | Pro+ users only | **Client-side check + API check** | Both check, but API check may be weak | `app/api/analytics/export/route.ts` | Strengthen API Pro check |
| **Buyer Matching** | `/api/buyers/match` | Wholesalers only | **All authenticated users** | Missing role check | `app/api/buyers/match/route.ts` | Add wholesaler role check |

**Severity:**
- **CRITICAL:** Admin routes, Wholesaler routes, Pro features (revenue impact)
- **HIGH:** Listing creation, Contact info (data integrity, revenue)
- **MEDIUM:** Client-side only checks (can be bypassed but API will reject)

---

## 6. Recommended Code Changes

### 6.1 Admin Route Protection

**File:** `app/admin/layout.tsx`

**Current Issue:** Layout checks admin status but doesn't redirect non-admins.

**Fix:**
```typescript
import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
import { isAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?next=/admin');
  }

  const userIsAdmin = await isAdmin(session.user.id, supabase);
  if (!userIsAdmin) {
    redirect('/account?error=admin_required');
  }

  return <>{children}</>;
}
```

### 6.2 Wholesaler Route Protection

**File:** `app/my-listings/page.tsx`

**Current Issue:** No role check - investors can access.

**Fix:**
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/supabase/client';

export default function MyListingsPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [roleCheck, setRoleCheck] = useState<'checking' | 'allowed' | 'denied'>('checking');

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace('/login?next=/my-listings');
      return;
    }

    const checkRole = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, segment')
        .eq('id', session.user.id)
        .single();

      const role = profile?.segment || profile?.role;
      if (role !== 'wholesaler' && role !== 'admin') {
        router.replace('/account?error=wholesaler_required');
        setRoleCheck('denied');
        return;
      }
      setRoleCheck('allowed');
    };

    checkRole();
  }, [session, loading, router]);

  if (loading || roleCheck === 'checking') {
    return <div>Loading...</div>;
  }

  if (roleCheck === 'denied') {
    return null;
  }

  // ... rest of component
}
```

**Alternative (Server Component):**
```typescript
import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/createSupabaseServer';

export default async function MyListingsPage() {
  const supabase = await createSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?next=/my-listings');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, segment')
    .eq('id', session.user.id)
    .single();

  const role = profile?.segment || profile?.role;
  if (role !== 'wholesaler' && role !== 'admin') {
    redirect('/account?error=wholesaler_required');
  }

  // ... rest of component
}
```

### 6.3 Pro Feature Protection

**File:** `app/analytics/lead-conversion/page.tsx`

**Current Issue:** Client-side check only.

**Fix:**
```typescript
import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
import { getUserSubscriptionTier } from '@/lib/subscription';

export default async function LeadConversionPage() {
  const supabase = await createSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?next=/analytics/lead-conversion');
  }

  const tier = await getUserSubscriptionTier(session.user.id, supabase);
  const isPro = tier.includes('PRO') || tier.includes('ENTERPRISE');
  
  if (!isPro) {
    redirect('/pricing?tier=pro&highlight=pro&reason=analytics_requires_pro');
  }

  // ... rest of component
}
```

### 6.4 API Role Check for Listing Creation

**File:** `app/api/listings/route.ts`

**Current Issue:** No role check - investors can create listings.

**Fix:**
```typescript
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role - only wholesalers can create listings
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, segment')
      .eq('id', user.id)
      .single();

    const role = profile?.segment || profile?.role;
    const isAdmin = role === 'admin';
    const isWholesaler = role === 'wholesaler';

    if (!isAdmin && !isWholesaler) {
      return NextResponse.json(
        { error: 'Only wholesalers can create listings' },
        { status: 403 }
      );
    }

    // ... rest of POST handler
  }
}
```

### 6.5 Reusable Auth Guards

**Create:** `app/lib/auth/guards.ts`

```typescript
import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
import { isAdmin } from '@/lib/admin';
import { getUserSubscriptionTier } from '@/lib/subscription';

export async function requireAuth(redirectTo?: string): Promise<{ user: User; supabase: SupabaseClient }> {
  const supabase = await createSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect(redirectTo || `/login?next=${encodeURIComponent(redirectTo || '/')}`);
  }

  return { user: session.user, supabase };
}

export async function requireRole(
  allowedRoles: ('investor' | 'wholesaler' | 'admin')[],
  redirectTo?: string
): Promise<{ user: User; supabase: SupabaseClient; role: string }> {
  const { user, supabase } = await requireAuth(redirectTo);

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, segment')
    .eq('id', user.id)
    .single();

  const role = profile?.segment || profile?.role || '';
  const isAdminUser = role === 'admin';

  if (!isAdminUser && !allowedRoles.includes(role as any)) {
    redirect(redirectTo || '/account?error=role_required');
  }

  return { user, supabase, role };
}

export async function requireSubscription(
  minTier: 'basic' | 'pro' | 'enterprise',
  redirectTo?: string
): Promise<{ user: User; supabase: SupabaseClient; tier: SubscriptionTier }> {
  const { user, supabase } = await requireAuth(redirectTo);

  const tier = await getUserSubscriptionTier(user.id, supabase);
  const tierLevels = { free: 0, basic: 1, pro: 2, enterprise: 3 };
  const minLevel = tierLevels[minTier];
  const userLevel = tierLevels[tier.toLowerCase() as keyof typeof tierLevels] || 0;

  if (userLevel < minLevel) {
    redirect(redirectTo || `/pricing?tier=${minTier}&highlight=${minTier}`);
  }

  return { user, supabase, tier };
}
```

**Usage Example:**
```typescript
// In a server component
import { requireRole } from '@/lib/auth/guards';

export default async function MyListingsPage() {
  const { user, supabase, role } = await requireRole(['wholesaler', 'admin']);
  // ... rest of component
}
```

### 6.6 API Route Guards

**Create:** `app/lib/auth/api-guards.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
import { isAdmin } from '@/lib/admin';
import { getUserSubscriptionTier } from '@/lib/subscription';

export async function requireAuthAPI(request: NextRequest): Promise<
  | { user: User; supabase: SupabaseClient }
  | { response: NextResponse }
> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  return { user, supabase };
}

export async function requireRoleAPI(
  request: NextRequest,
  allowedRoles: ('investor' | 'wholesaler' | 'admin')[]
): Promise<
  | { user: User; supabase: SupabaseClient; role: string }
  | { response: NextResponse }
> {
  const authResult = await requireAuthAPI(request);
  if ('response' in authResult) {
    return authResult;
  }

  const { user, supabase } = authResult;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, segment')
    .eq('id', user.id)
    .single();

  const role = profile?.segment || profile?.role || '';
  const isAdminUser = role === 'admin';

  if (!isAdminUser && !allowedRoles.includes(role as any)) {
    return {
      response: NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      ),
    };
  }

  return { user, supabase, role };
}

export async function requireSubscriptionAPI(
  request: NextRequest,
  minTier: 'basic' | 'pro' | 'enterprise'
): Promise<
  | { user: User; supabase: SupabaseClient; tier: SubscriptionTier }
  | { response: NextResponse }
> {
  const authResult = await requireAuthAPI(request);
  if ('response' in authResult) {
    return authResult;
  }

  const { user, supabase } = authResult;
  const tier = await getUserSubscriptionTier(user.id, supabase);
  const tierLevels = { free: 0, basic: 1, pro: 2, enterprise: 3 };
  const minLevel = tierLevels[minTier];
  const userLevel = tierLevels[tier.toLowerCase() as keyof typeof tierLevels] || 0;

  if (userLevel < minLevel) {
    return {
      response: NextResponse.json(
        { error: 'Subscription upgrade required', requiredTier: minTier },
        { status: 403 }
      ),
    };
  }

  return { user, supabase, tier };
}
```

**Usage Example:**
```typescript
// In an API route
import { requireRoleAPI } from '@/lib/auth/api-guards';

export async function POST(request: NextRequest) {
  const roleResult = await requireRoleAPI(request, ['wholesaler', 'admin']);
  if ('response' in roleResult) {
    return roleResult.response;
  }

  const { user, supabase, role } = roleResult;
  // ... rest of handler
}
```

---

## 7. QA/Test Matrix Template

| Category | Test ID | Scenario | Route/API | User Level | Preconditions | Steps | Expected Result |
|----------|--------|----------|-----------|------------|---------------|-------|-----------------|
| Auth | AUTH-001 | Anonymous user tries to access watchlist | `/watchlists` | Anonymous | Not logged in | Navigate to /watchlists | Redirected to /login with next parameter |
| Auth | AUTH-002 | Anonymous user tries to create listing | `/my-listings/new` | Anonymous | Not logged in | Navigate to /my-listings/new | Redirected to /login |
| Auth | AUTH-003 | Anonymous user tries to send message | `/api/messages` POST | Anonymous | Not logged in | POST to /api/messages | Returns 401 Unauthorized |
| Role | ROLE-001 | Investor tries to access my-listings | `/my-listings` | Investor Free | Logged in as investor | Navigate to /my-listings | Redirected to /account with error message |
| Role | ROLE-002 | Investor tries to create listing via API | `/api/listings` POST | Investor Free | Logged in as investor | POST listing data | Returns 403 Forbidden |
| Role | ROLE-003 | Wholesaler creates listing | `/api/listings` POST | Wholesaler Free | Logged in as wholesaler | POST listing data | Returns 200, listing created |
| Role | ROLE-004 | Investor accesses analyzer | `/tools/analyzer` | Investor Free | Logged in as investor | Navigate to /tools/analyzer | Page loads, investor analyzer shown |
| Role | ROLE-005 | Wholesaler accesses analyzer | `/tools/analyzer` | Wholesaler Free | Logged in as wholesaler | Navigate to /tools/analyzer | Page loads, wholesaler analyzer shown |
| Admin | ADMIN-001 | Non-admin tries to access admin dashboard | `/admin` | Investor Pro | Logged in as investor | Navigate to /admin | Redirected to /account with error |
| Admin | ADMIN-002 | Non-admin tries admin API | `/api/admin/users` GET | Investor Pro | Logged in as investor | GET /api/admin/users | Returns 403 Forbidden |
| Admin | ADMIN-003 | Admin accesses dashboard | `/admin` | Admin | Logged in as admin | Navigate to /admin | Page loads, admin tools visible |
| Admin | ADMIN-004 | Admin accesses user management | `/admin/users` | Admin | Logged in as admin | Navigate to /admin/users | Page loads, user list visible |
| Subscription | SUB-001 | Free user tries Pro analytics | `/analytics/lead-conversion` | Investor Free | Logged in as free investor | Navigate to /analytics/lead-conversion | Redirected to /pricing with Pro highlight |
| Subscription | SUB-002 | Free user tries analytics API | `/api/analytics` GET | Investor Free | Logged in as free investor | GET /api/analytics | Returns 403 with upgrade message |
| Subscription | SUB-003 | Pro user accesses analytics | `/analytics/lead-conversion` | Investor Pro | Logged in as Pro investor | Navigate to /analytics/lead-conversion | Page loads, analytics visible |
| Subscription | SUB-004 | Free user views contact info | `/listing/[id]` | Investor Free | Logged in, viewing listing | View listing detail page | Contact info hidden, upgrade prompt shown |
| Subscription | SUB-005 | Basic user views contact info | `/listing/[id]` | Investor Basic | Logged in as Basic, viewing listing | View listing detail page | Contact info visible |
| Subscription | SUB-006 | Free user exceeds AI quota | `/api/analyze-structured` POST | Investor Free | Logged in, 2 analyses used | POST analysis request | Returns 429, quota exceeded message |
| Subscription | SUB-007 | Pro user uses AI analysis | `/api/analyze-structured` POST | Investor Pro | Logged in as Pro, under quota | POST analysis request | Returns 200, analysis performed |
| Listing | LIST-001 | Anonymous browses listings | `/listings` | Anonymous | Not logged in | Navigate to /listings | Page loads, listings visible |
| Listing | LIST-002 | User adds to watchlist | `/api/watchlists` POST | Investor Free | Logged in, viewing listing | Click Add to Watchlist | Returns 200, item added |
| Listing | LIST-003 | User views watchlist | `/watchlists` | Investor Free | Logged in, has watchlist items | Navigate to /watchlists | Page loads, watchlist items visible |
| Listing | LIST-004 | Wholesaler creates listing | `/my-listings/new` | Wholesaler Free | Logged in as wholesaler | Fill form, submit | Listing created, redirects to /my-listings |
| Listing | LIST-005 | Wholesaler edits own listing | `/my-listings` | Wholesaler Free | Logged in, owns listing | Edit listing, save | Listing updated |
| Listing | LIST-006 | User tries to edit others listing | `/api/listings` PATCH | Investor Free | Logged in, viewing others listing | PATCH listing data | Returns 403, ownership check fails |
| Messaging | MSG-001 | User sends message | `/api/messages` POST | Investor Free | Logged in, viewing listing | Send message to owner | Returns 200, message sent |
| Messaging | MSG-002 | User views messages | `/messages` | Investor Free | Logged in, has messages | Navigate to /messages | Page loads, conversations visible |
| Messaging | MSG-003 | Anonymous tries to message | `/api/messages` POST | Anonymous | Not logged in | POST message data | Returns 401 Unauthorized |
| Billing | BILL-001 | User views billing | `/billing` | Investor Basic | Logged in, has subscription | Navigate to /billing | Page loads, subscription details visible |
| Billing | BILL-002 | User creates checkout | `/api/billing/create-checkout-session` POST | Investor Free | Logged in, no subscription | POST checkout request | Returns 200, Stripe session created |
| Billing | BILL-003 | Anonymous tries billing | `/billing` | Anonymous | Not logged in | Navigate to /billing | Redirected to /login |
| API | API-001 | Anonymous calls protected API | `/api/watchlists` GET | Anonymous | Not logged in | GET /api/watchlists | Returns 401 Unauthorized |
| API | API-002 | User calls public API | `/api/geocode` POST | Anonymous | Not logged in | POST geocode request | Returns 200, coordinates returned |
| API | API-003 | User exceeds quota | `/api/analyze-structured` POST | Investor Free | Logged in, quota exceeded | POST analysis request | Returns 429, quota message |
| API | API-004 | Admin bypasses quota | `/api/analyze-structured` POST | Admin | Logged in as admin | POST analysis request | Returns 200, analysis performed (bypass) |

---

## Summary & Priority Actions

### Critical (Fix Immediately)
1. **Admin routes** - Add server-side redirects in `app/admin/layout.tsx`
2. **Wholesaler routes** - Add role checks to `/my-listings/*` and `/post`
3. **Listing creation API** - Add role check to `/api/listings` POST
4. **Pro features** - Add server-side checks to `/analytics/*` routes

### High Priority
5. **Contact info** - Add server-side subscription check
6. **Client-side only routes** - Add server-side redirects or rely on API 401s
7. **Buyer matching API** - Add wholesaler role check

### Medium Priority
8. **Create reusable guard helpers** - `requireAuth()`, `requireRole()`, `requireSubscription()`
9. **Standardize API auth patterns** - Use consistent `requireAuthAPI()` pattern
10. **Add comprehensive logging** - Log all access denials for security monitoring

---

**End of Audit Report**

