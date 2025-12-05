# Off Axis Deals - Complete Route Checklist

Use this list to test every page in the application. Routes are organized by category.

## 🌐 Public Pages (No Auth Required)

### Main Pages
- `/` - Root (redirects to `/welcome`)
- `/welcome` - Welcome/Landing page
- `/login` - Login page
- `/signup` - Sign up page
- `/reset-password` - Password reset page
- `/pricing` - Pricing plans page
- `/contact-sales` - Contact sales page

### Legal/Info Pages
- `/terms` - Terms of service
- `/privacy` - Privacy policy
- `/disclaimer` - Disclaimer
- `/refund-policy` - Refund policy

### Listings (Public View)
- `/listings` - Browse all listings (map/list view)
- `/listing/[id]` - Individual listing detail page (dynamic route)
- `/simple-listings` - Simple listings view
- `/browse` - Browse properties placeholder

### Other Public Pages
- `/map` - Map view
- `/map-test` - Map test page
- `/feedback` - Feedback form

---

## 🔐 Authenticated Pages (Login Required)

### User Dashboard & Profile
- `/account` - User account settings
- `/profile` - User profile page
- `/settings` - Settings page
- `/settings/notifications` - Notification settings
- `/watchlists` - User's watchlist
- `/saved-searches` - Saved searches
- `/my-listings` - My listings (wholesaler)
- `/my-listings/new` - Create new listing (wholesaler)
- `/messages` - Messages inbox
- `/messages/[listingId]` - Messages for specific listing (dynamic route)
- `/notifications` - Notifications page
- `/alerts` - Alerts page

### Portal Pages
- `/portal/investor` - Investor portal
- `/portal/wholesaler` - Wholesaler portal

### Post/Create
- `/post` - Post a deal/listing

### Analytics (Pro/Admin)
- `/analytics` - Analytics dashboard
- `/analytics/heatmap` - Analytics heatmap
- `/analytics/lead-conversion` - Lead conversion analytics
- `/analytics/export` - Analytics export
- `/analytics/market-heatmap` - Market heatmap

### Tools
- `/tools/analyzer` - AI Analyzer tool
- `/billing` - Billing management
- `/billing/cancel` - Cancel subscription

---

## 👑 Admin Pages (Admin Only)

### Admin Dashboard
- `/admin` - Admin dashboard
- `/admin/analytics` - Admin analytics
- `/admin/analytics/heatmap` - Admin heatmap
- `/admin/analytics/lead-conversion` - Admin lead conversion
- `/admin/analytics/export` - Admin analytics export

### Admin Management
- `/admin/users` - User management
- `/admin/watchlists` - Watchlist management
- `/admin/flags` - Flag management
- `/admin/alerts` - Alert management
- `/admin/support` - Support tickets
- `/admin/feedback` - User feedback
- `/admin/reports` - Reports
- `/admin/crm-export` - CRM export
- `/admin/audit-logs` - Audit logs
- `/admin/ai-usage` - AI usage monitoring
- `/admin/branding` - Branding settings
- `/admin/team` - Team management
- `/admin/off-market` - Off-market listings
- `/admin/repair-estimator` - Repair estimator
- `/admin/integrations` - Integrations
- `/admin/api-docs` - API documentation

---

## 🔧 Debug/Test Pages (Dev Only - May require auth)

- `/debug-auth` - Debug authentication
- `/diagnose` - Diagnostic page
- `/test-db-connection` - Test database connection
- `/debug-db` - Debug database
- `/envtest` - Environment test
- `/apitest` - API test
- `/add-test-data` - Add test data
- `/my` - My page (test)

---

## 🔄 Auth Routes

- `/auth/callback` - OAuth callback (handled by Supabase)
- `/auth/signout` - Sign out route (API)

---

## 📡 API Routes

### Listings API
- `GET/POST /api/listings` - List/create listings
- `GET/PUT/DELETE /api/listings/[id]` - Get/update/delete listing (dynamic)
- `POST /api/listings/[id]/view` - Increment listing view count (dynamic)
- `GET /api/listings.geojson` - Listings as GeoJSON
- `POST /api/listings/polygon-search` - Polygon search
- `POST /api/listings/backfill-geo` - Backfill geocoding

### Watchlists API
- `GET /api/watchlists` - Get user watchlist
- `POST /api/watchlists` - Add to watchlist
- `DELETE /api/watchlists?listingId=xxx` - Remove from watchlist
- `GET /api/debug/watchlist` - Debug watchlist

### Messages API
- `GET /api/messages` - Get messages
- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/unread-count` - Get unread count

### Notifications API
- `GET /api/notifications` - Get notifications
- `GET/PUT /api/notifications/preferences` - Notification preferences
- `GET /api/notifications/unread-count` - Unread count

### Analytics API
- `GET /api/analytics` - User analytics
- `GET /api/analytics/heatmap` - Heatmap data
- `GET /api/analytics/export` - Export analytics

### Billing/Stripe API
- `POST /api/billing/create-checkout-session` - Create checkout session
- `POST /api/billing/portal` - Stripe customer portal
- `POST /api/billing/cancel-subscription` - Cancel subscription
- `POST /api/billing/webhook` - Stripe webhook
- `POST /api/stripe/webhook` - Stripe webhook (alternate)
- `POST /api/stripe/checkout` - Stripe checkout

### AI Analysis API
- `POST /api/analyze` - AI analysis
- `POST /api/analyze-structured` - Structured AI analysis
- `GET /api/ai-usage` - AI usage stats

### Markets API
- `GET /api/markets/snapshot` - Market snapshot data

### Admin API
- `GET /api/admin/debug-auth` - Debug auth
- `GET /api/admin/debug-cookies` - Debug cookies
- `GET /api/admin/diagnose` - Diagnostics
- `GET/POST /api/admin/users` - User management
- `GET/POST /api/admin/flags` - Flag management
- `GET/POST /api/admin/support-tickets` - Support tickets
- `GET /api/admin/reports` - Reports
- `POST /api/admin/fix-account` - Fix account

### Other API Routes
- `GET /api/saved-searches` - Saved searches
- `GET/POST /api/alerts` - Alerts
- `GET /api/geocode` - Geocoding
- `GET /api/health` - Health check
- `POST /api/feedback` - Submit feedback
- `POST /api/contact-sales` - Contact sales
- `POST /api/buyers/match` - Match buyers
- `GET /api/transactions` - Transactions
- `POST /api/transactions/[id]/confirm` - Confirm transaction (dynamic)
- `GET /api/test-email` - Test email
- `GET /api/email/test` - Email test
- `GET /api/email-diag` - Email diagnostics
- `GET /api/diagnostics/email` - Email diagnostics (alternate)
- `GET /api/debug/listings` - Debug listings
- `GET /api/route` - Route test
- `POST /api/cron/subscription-reminders` - Cron: subscription reminders
- `POST /api/cron/cleanup-ai-usage` - Cron: cleanup AI usage
- `POST /api/cron/daily-digest` - Cron: daily digest

---

## 📝 Testing Checklist

### Public Pages
- [ ] `/` → Should redirect to `/welcome`
- [ ] `/welcome` → Landing page loads
- [ ] `/login` → Login form works
- [ ] `/signup` → Signup form works
- [ ] `/pricing` → Pricing page displays correctly
- [ ] `/listings` → Listings page loads (map/list view)
- [ ] `/listing/[id]` → Individual listing displays
- [ ] `/terms`, `/privacy`, `/disclaimer`, `/refund-policy` → Legal pages load

### Authenticated Pages (Test as both investor and wholesaler)
- [ ] `/account` → Account settings load
- [ ] `/profile` → Profile page loads
- [ ] `/watchlists` → Watchlist page works
- [ ] `/saved-searches` → Saved searches page works
- [ ] `/my-listings` → My listings (wholesaler only)
- [ ] `/messages` → Messages inbox works
- [ ] `/notifications` → Notifications page works
- [ ] `/analytics` → Analytics (Pro/Admin only)
- [ ] `/billing` → Billing page works
- [ ] `/tools/analyzer` → AI Analyzer works

### Admin Pages (Test as admin)
- [ ] `/admin` → Admin dashboard loads
- [ ] `/admin/users` → User management works
- [ ] `/admin/analytics` → Admin analytics work
- [ ] `/admin/support` → Support tickets work
- [ ] All other admin pages

### API Routes (Test key endpoints)
- [ ] `POST /api/watchlists` → Add to watchlist works (fix this!)
- [ ] `GET /api/watchlists` → Get watchlist works
- [ ] `POST /api/listings/[id]/view` → View counter increments
- [ ] `GET /api/analytics` → Analytics data loads
- [ ] `POST /api/billing/create-checkout-session` → Checkout works

---

## 🔑 Authentication Notes

- **Public pages**: No auth required
- **Authenticated pages**: Require login; will redirect to `/login` if not authenticated
- **Admin pages**: Require admin role; will show error or redirect if not admin
- **Pro pages**: Require Pro tier subscription (e.g., `/analytics`)

---

## 🌍 Dynamic Routes

These routes accept parameters:
- `/listing/[id]` - Replace `[id]` with actual listing UUID
- `/messages/[listingId]` - Replace `[listingId]` with listing UUID
- `/api/listings/[id]` - Replace `[id]` with listing UUID
- `/api/listings/[id]/view` - Replace `[id]` with listing UUID
- `/api/transactions/[id]/confirm` - Replace `[id]` with transaction UUID

Example: `/listing/e1739721-c70c-4794-a30e-8a090a67d8e3`

---

## 📋 Quick Test Order

1. Start with public pages (no login needed)
2. Test authentication flow (signup/login)
3. Test authenticated user pages (as investor)
4. Test authenticated user pages (as wholesaler)
5. Test admin pages (as admin)
6. Test API endpoints via browser dev tools or Postman
7. Test watchlist functionality (the current bug we're fixing!)

---

## 🐛 Known Issues to Check

- [ ] **Watchlist 403 Error**: Test adding a listing to watchlist on `/listing/[id]` page
- [ ] **View Counter**: Check if listing view counter increments correctly
- [ ] **Authentication**: Verify no sign-in loops on protected pages
- [ ] **Billing**: Ensure Stripe checkout still works after recent changes

