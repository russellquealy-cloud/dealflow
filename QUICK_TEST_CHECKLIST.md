# Quick Test Checklist - Admin Area & Optional Features

## ✅ Admin Authentication & Access
- [ ] Log in as admin user
- [ ] Visit `/admin` - should load without sign-in loops
- [ ] Visit `/admin/access-denied` as non-admin - should show "Forbidden" message
- [ ] All admin pages accessible without 404/401/403 errors

## 📊 Report Generation (`/admin/reports`)
- [ ] Click "Generate CSV Report" for Property Listings Report
- [ ] Verify CSV downloads with correct filename
- [ ] Generate User Activity Report - verify download
- [ ] Generate Financial Report - verify download
- [ ] Generate Market Analysis Report - verify download
- [ ] Check "Recent Reports" section shows generated reports

## 🎫 Support Tickets (`/admin/support`)
- [ ] Click "Create Ticket" button
- [ ] Fill out form (subject, description, category, priority)
- [ ] Submit ticket - verify success message
- [ ] Verify ticket appears in list immediately
- [ ] Test status filters (All, Open, In Progress, Resolved)
- [ ] Test priority filters (All, High, Medium, Low)
- [ ] Update ticket status (Mark In Progress, Resolve)
- [ ] Change ticket priority via dropdown
- [ ] Verify stats cards show correct counts

## 📈 Analytics Dashboard (`/admin/analytics`)
- [ ] Verify key metrics display (Total Listings, Users, Messages, Watchlists)
- [ ] Test date range filter (7/30/90 days, All Time)
- [ ] Verify "Users by Tier" breakdown shows correct counts
- [ ] Verify "Listings by Status" breakdown shows correct counts
- [ ] Verify "Users by Role" breakdown shows correct counts
- [ ] Check "Recent Activity" chart displays (7-day bar chart)
- [ ] Verify quick action links work (Reports, User Management, AI Usage)

## 🔔 Real-Time Updates
- [ ] Open `/admin/alerts` in one tab
- [ ] Create/update an alert in another tab or via API
- [ ] Verify alert appears/updates automatically without refresh
- [ ] Open `/admin/watchlists` in one tab
- [ ] Add/remove watchlist item in another tab
- [ ] Verify watchlist updates automatically without refresh

## 🔍 Other Admin Pages (Stub Verification)
- [ ] Visit `/admin/repair-estimator` - should show "Coming soon" (no 404)
- [ ] Visit `/admin/crm-export` - should show "Coming soon" (no 404)
- [ ] Visit `/admin/off-market` - should show "Coming soon" (no 404)
- [ ] Visit `/admin/team` - should show "Coming soon" (no 404)
- [ ] Visit `/admin/branding` - should show "Coming soon" (no 404)
- [ ] Visit `/admin/integrations` - should show "Coming soon" (no 404)
- [ ] Visit `/admin/api-docs` - should show "Coming soon" (no 404)

## 🔧 Admin Diagnostics
- [ ] Visit `/api/admin/diagnose` - should return 200 with admin info
- [ ] Click "Send Test Email to Myself" on admin dashboard
- [ ] Verify email is sent successfully (check inbox)
- [ ] Click "Fix Admin Account" - verify success message

## 🚨 Error Handling
- [ ] Verify no console errors in browser DevTools
- [ ] Verify no 404/401/403/405 errors when navigating admin pages
- [ ] Verify error messages are user-friendly (no raw stack traces)

## ⚡ Performance
- [ ] Reports generate within reasonable time (< 10 seconds)
- [ ] Analytics dashboard loads quickly (< 3 seconds)
- [ ] Real-time updates appear within 1-2 seconds

---

## Quick Smoke Test (5 minutes)
1. ✅ Log in as admin → `/admin` loads
2. ✅ Generate one CSV report → downloads successfully
3. ✅ Create one support ticket → appears in list
4. ✅ View analytics dashboard → data displays correctly
5. ✅ Check browser console → no errors

---

## Notes
- All admin features should work without sign-in loops
- All stub pages should show "Coming soon" messages (no 404s)
- Real-time updates should work automatically
- Reports should download as CSV files

