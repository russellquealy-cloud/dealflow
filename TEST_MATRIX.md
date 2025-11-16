# Off Axis Deals - Test Matrix
**Generated:** February 2025  
**Purpose:** Comprehensive testing checklist for deployment verification

---

## 🎯 Pre-Deployment Checklist

### Run Automated Pre-Launch Checks
```bash
# Test against local development
pnpm prelaunch-check http://localhost:3000

# Test against production
pnpm prelaunch-check https://offaxisdeals.com
```

**Expected:** All checks should pass or show only warnings (no errors)

---

## 🔐 Authentication & User Management

### Test ID: A1 - User Registration
**Priority:** 🔴 CRITICAL  
**Status:** ✅ Ready to Test

**Steps:**
1. Navigate to `/signup`
2. Enter email and password
3. Submit registration form
4. Check email for verification link (if email configured)
5. Complete email verification

**Expected Results:**
- ✅ Registration form submits successfully
- ✅ User redirected to appropriate page
- ✅ Profile created in database
- ✅ Email sent (if SMTP configured)

**Known Issues:**
- Email delivery requires Supabase SMTP configuration

---

### Test ID: A2 - Magic Link Login
**Priority:** 🔴 CRITICAL  
**Status:** ✅ Ready to Test

**Steps:**
1. Navigate to `/login`
2. Enter email address
3. Click "Send Magic Link"
4. Check email for magic link
5. Click magic link in email
6. Verify redirect to `/login` with session

**Expected Results:**
- ✅ Magic link request succeeds
- ✅ Email sent with correct redirect URL
- ✅ Clicking link authenticates user
- ✅ User redirected to `/login` then to intended page
- ✅ Session persists after page reload

**Known Issues:**
- Email delivery requires Supabase SMTP configuration
- URL allowlist must include `/login` endpoint

**Test URLs:**
- `http://localhost:3000/login`
- `https://offaxisdeals.com/login`

---

### Test ID: A3 - Password Reset
**Priority:** 🔴 CRITICAL  
**Status:** ✅ Ready to Test

**Steps:**
1. Navigate to `/login`
2. Click "Forgot Password"
3. Enter email address
4. Submit password reset request
5. Check email for reset link
6. Click reset link
7. Verify redirect to `/reset-password`
8. Enter new password and confirm
9. Submit new password
10. Login with new password

**Expected Results:**
- ✅ Password reset request succeeds
- ✅ Email sent with correct redirect URL
- ✅ Clicking link redirects to `/reset-password`
- ✅ Password update succeeds
- ✅ Can login with new password

**Known Issues:**
- Email delivery requires Supabase SMTP configuration
- URL allowlist must include `/reset-password` endpoint

**Test URLs:**
- `http://localhost:3000/reset-password`
- `https://offaxisdeals.com/reset-password`

---

### Test ID: A4 - Email/Password Login
**Priority:** 🔴 CRITICAL  
**Status:** ✅ Ready to Test

**Steps:**
1. Navigate to `/login`
2. Enter email and password
3. Submit login form
4. Verify successful login
5. Check session persists after reload

**Expected Results:**
- ✅ Login succeeds with correct credentials
- ✅ Login fails with incorrect credentials
- ✅ User redirected to appropriate page
- ✅ Session persists across page reloads

---

### Test ID: A5 - Admin Dashboard Access
**Priority:** 🔴 CRITICAL  
**Status:** ✅ Ready to Test

**Steps:**
1. Login as admin user
2. Navigate to `/admin` (direct URL)
3. Verify admin dashboard loads
4. Test admin-only features:
   - User moderation
   - Flags & reports
   - Audit logs
   - AI usage reporting
   - Email diagnostics

**Expected Results:**
- ✅ Admin dashboard accessible for admin users
- ✅ Non-admin users see error or redirect
- ✅ All admin features functional
- ✅ Admin actions logged in audit log

---

## 🏠 Listings Management

### Test ID: L1 - Listings Load & Display
**Priority:** 🔴 CRITICAL  
**Status:** ✅ Ready to Test

**Steps:**
1. Navigate to `/listings`
2. Verify listings load from database
3. Check map displays markers
4. Verify list view shows listing cards
5. Test pagination (if implemented)

**Expected Results:**
- ✅ Listings load within 5 seconds
- ✅ Map shows correct markers
- ✅ List view shows all listings
- ✅ No console errors

---

### Test ID: L2 - Create New Listing
**Priority:** 🔴 CRITICAL  
**Status:** ✅ Ready to Test

**Steps:**
1. Login as wholesaler
2. Navigate to `/my-listings/new` or `/post`
3. Fill out listing form:
   - Title, address, price
   - Property details (beds, baths, sqft)
   - Description
   - Images (if available)
4. Submit form
5. Verify listing appears in "My Listings"
6. Verify listing appears in public listings

**Expected Results:**
- ✅ Form submits successfully
- ✅ Listing created in database
- ✅ Listing appears in "My Listings"
- ✅ Listing appears in public listings
- ✅ Listing appears on map

---

### Test ID: L3 - Search & Map Sync
**Priority:** 🔴 CRITICAL  
**Status:** ✅ Ready to Test

**Steps:**
1. Navigate to `/listings`
2. Enter search query (e.g., "Miami, FL")
3. Submit search
4. Verify map recenters to search location
5. Verify list filters to show listings in map bounds
6. Verify map marker count matches list count

**Expected Results:**
- ✅ Search geocodes correctly
- ✅ Map recenters to search location
- ✅ List filters by map bounds
- ✅ Marker count matches list count
- ✅ No "No listings found" when markers visible

---

### Test ID: L4 - Filters & Sorting
**Priority:** 🟠 HIGH  
**Status:** ✅ Ready to Test

**Steps:**
1. Navigate to `/listings`
2. Open filters drawer
3. Apply filters:
   - Price range
   - Property type
   - Beds/baths
   - Square footage
4. Apply sorting options
5. Verify results update

**Expected Results:**
- ✅ Filters apply correctly
- ✅ List updates with filtered results
- ✅ Map markers update
- ✅ Sorting works correctly
- ✅ Mobile filter drawer works

---

### Test ID: L5 - Listing Detail View
**Priority:** 🟠 HIGH  
**Status:** ✅ Ready to Test

**Steps:**
1. Navigate to `/listings`
2. Click on a listing card
3. Verify detail page loads
4. Check all information displays:
   - Images
   - Property details
   - Description
   - Owner information
5. Test watchlist button
6. Test message button

**Expected Results:**
- ✅ Detail page loads correctly
- ✅ All information displays
- ✅ Images load properly
- ✅ Watchlist button works
- ✅ Message button works

---

## 💰 Payments & Subscriptions

### Test ID: P1 - Stripe Checkout
**Priority:** 🔴 CRITICAL  
**Status:** ✅ Ready to Test

**Steps:**
1. Login as user
2. Navigate to `/pricing`
3. Click "Upgrade" on a tier
4. Verify Stripe checkout opens
5. Check checkout displays:
   - Business name: "Off Axis Deals LLC"
   - Clear tier name and description
   - Support email
6. Complete test payment (use Stripe test card)
7. Verify subscription updates

**Expected Results:**
- ✅ Checkout opens correctly
- ✅ All metadata displays correctly
- ✅ Payment processes successfully
- ✅ Subscription tier updates
- ✅ User redirected to success page

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

---

### Test ID: P2 - Subscription Management
**Priority:** 🟠 HIGH  
**Status:** ✅ Ready to Test

**Steps:**
1. Login as subscribed user
2. Navigate to `/account` or `/billing`
3. Verify current subscription displays
4. Test subscription actions:
   - View billing history
   - Cancel subscription
   - Update payment method
   - Reactivate subscription

**Expected Results:**
- ✅ Current subscription displays correctly
- ✅ Billing history shows transactions
- ✅ Cancel subscription works
- ✅ Payment method update works

---

## 💬 Messaging

### Test ID: M1 - Send Message
**Priority:** 🔴 CRITICAL  
**Status:** ✅ Ready to Test

**Steps:**
1. Login as investor
2. Navigate to a listing detail page
3. Click "Message Owner"
4. Compose and send message
5. Verify message appears in conversation
6. Login as listing owner
7. Verify message received
8. Verify read receipt updates

**Expected Results:**
- ✅ Message sends successfully
- ✅ Message appears in sender's conversation
- ✅ Message appears in recipient's conversation
- ✅ Read receipt updates when message read
- ✅ Unread indicator shows correctly

---

### Test ID: M2 - Conversation List
**Priority:** 🟠 HIGH  
**Status:** ✅ Ready to Test

**Steps:**
1. Login as user with messages
2. Navigate to `/messages`
3. Verify conversation list displays
4. Check unread indicators:
   - Red badge with count
   - Blue background for unread
5. Click on conversation
6. Verify messages load

**Expected Results:**
- ✅ Conversation list displays
- ✅ Unread indicators show correctly
- ✅ Conversations sorted by latest message
- ✅ Clicking conversation opens thread
- ✅ Messages load correctly

---

### Test ID: M3 - Read Receipts
**Priority:** 🟠 HIGH  
**Status:** ✅ Ready to Test

**Steps:**
1. Send message from User A to User B
2. Login as User B
3. Open conversation with User A
4. Verify message shows as unread
5. View message (scroll to it)
6. Verify read receipt updates (✓✓)
7. Login as User A
8. Verify read receipt shows in sent message

**Expected Results:**
- ✅ Unread messages show no receipt
- ✅ Read messages show ✓✓ receipt
- ✅ Receipt updates when message viewed
- ✅ Receipt visible to sender

---

## 🔔 Notifications

### Test ID: N1 - Notification Preferences
**Priority:** 🟠 HIGH  
**Status:** ✅ Ready to Test

**Steps:**
1. Login as user
2. Navigate to `/settings/notifications` or `/account`
3. Click "Notification Preferences"
4. Toggle notification preferences
5. Verify preferences save
6. Test notification triggers:
   - Receive message (lead_message)
   - Add to watchlist (buyer_interest)
   - Saved search match (saved_search_match)

**Expected Results:**
- ✅ Preferences page loads
- ✅ Toggles work correctly
- ✅ Preferences save to database
- ✅ Notifications respect preferences
- ✅ Email sent when preference enabled

---

### Test ID: N2 - In-App Notifications
**Priority:** 🟠 HIGH  
**Status:** ✅ Ready to Test

**Steps:**
1. Login as user
2. Navigate to `/notifications`
3. Verify notifications list displays
4. Check unread count in header
5. Mark notifications as read
6. Verify unread count updates

**Expected Results:**
- ✅ Notifications list displays
- ✅ Unread count shows in header
- ✅ Marking as read updates count
- ✅ Notifications sorted by date

---

## 🛠️ Tools & Features

### Test ID: T1 - Watchlist
**Priority:** 🔴 CRITICAL  
**Status:** ⚠️ Needs Fix

**Steps:**
1. Login as investor
2. Navigate to a listing
3. Click "Add to Watchlist"
4. Navigate to `/watchlists`
5. Verify listing appears in watchlist
6. Test removing from watchlist

**Expected Results:**
- ✅ Add to watchlist works
- ✅ Listing appears in watchlist UI
- ✅ Remove from watchlist works
- ✅ Watchlist persists across sessions

**Known Issues:**
- 🔴 Saved properties not showing in watchlist UI (needs fix)

---

### Test ID: T2 - Saved Searches
**Priority:** 🟠 HIGH  
**Status:** ✅ Ready to Test

**Steps:**
1. Navigate to `/listings`
2. Apply filters and search
3. Click "Save Current Search"
4. Enter search name
5. Submit
6. Navigate to `/saved-searches`
7. Verify saved search appears
8. Click "Apply" on saved search
9. Verify filters applied

**Expected Results:**
- ✅ Save search works
- ✅ Saved search appears in list
- ✅ Apply search works
- ✅ Filters restore correctly
- ✅ Mobile layout works

---

### Test ID: T3 - AI Usage Display
**Priority:** 🟠 HIGH  
**Status:** ✅ Ready to Test

**Steps:**
1. Login as user
2. Navigate to `/account`
3. Verify AI Usage panel displays:
   - Used count
   - Remaining count
   - Resets on date
   - Progress bar
4. Use AI analyzer
5. Verify usage count updates
6. Test warning when < 20% remaining

**Expected Results:**
- ✅ Usage panel displays correctly
- ✅ Counts update after AI usage
- ✅ Warning shows when low
- ✅ Resets on date displays correctly

---

### Test ID: T4 - AI Analyzer
**Priority:** 🟠 HIGH  
**Status:** ✅ Ready to Test

**Steps:**
1. Login as investor or wholesaler
2. Navigate to `/tools/analyzer`
3. Select analysis type
4. Fill in property details
5. Run analysis
6. Verify results display
7. Check AI usage increments

**Expected Results:**
- ✅ Analyzer loads correctly
- ✅ Analysis runs successfully
- ✅ Results display correctly
- ✅ AI usage increments
- ✅ Quota enforcement works

---

## 📱 Mobile Experience

### Test ID: MOB1 - Mobile Layout
**Priority:** 🟠 HIGH  
**Status:** ✅ Ready to Test

**Steps:**
1. Open site on mobile device (or resize browser)
2. Test key screens:
   - Listings page
   - My Listings form
   - Messages
   - Profile
   - Filters drawer
3. Verify:
   - Touch targets are 44px minimum
   - Spacing is adequate
   - Text is readable
   - Forms are usable

**Expected Results:**
- ✅ All screens usable on mobile
- ✅ Touch targets meet standards
- ✅ No horizontal scrolling
- ✅ Forms are easy to fill
- ✅ Buttons are easy to tap

---

### Test ID: MOB2 - Mobile Map
**Priority:** 🟠 HIGH  
**Status:** ✅ Ready to Test

**Steps:**
1. Open listings page on mobile
2. Test map interaction:
   - Single-finger pan
   - Pinch to zoom
   - Tap markers
3. Verify:
   - Map doesn't scroll page
   - Panning works smoothly
   - Markers are tappable

**Expected Results:**
- ✅ Single-finger pan works
- ✅ Page doesn't scroll when panning map
- ✅ Zoom works correctly
- ✅ Markers are tappable

---

### Test ID: MOB3 - Mobile Auth
**Priority:** 🟠 HIGH  
**Status:** ✅ Ready to Test

**Steps:**
1. Open site on mobile
2. Login
3. Navigate between pages
4. Verify:
   - No auth flicker
   - Session persists
   - No sign-in loops

**Expected Results:**
- ✅ No auth flicker on page load
- ✅ Session persists across navigation
- ✅ No sign-in loops
- ✅ Smooth user experience

---

## 🔒 Admin Features

### Test ID: ADM1 - User Moderation
**Priority:** 🟠 HIGH  
**Status:** ✅ Ready to Test

**Steps:**
1. Login as admin
2. Navigate to `/admin/users`
3. Search for a user
4. Test moderation actions:
   - Suspend user
   - Ban user
   - Verify user
5. Verify action logged in audit log

**Expected Results:**
- ✅ User search works
- ✅ Moderation actions work
- ✅ Actions logged correctly
- ✅ Users see appropriate restrictions

---

### Test ID: ADM2 - Flags & Reports
**Priority:** 🟠 HIGH  
**Status:** ✅ Ready to Test

**Steps:**
1. Login as admin
2. Navigate to `/admin/flags`
3. View flagged content
4. Test flag resolution:
   - Change status
   - Add resolution notes
5. Verify flags update correctly

**Expected Results:**
- ✅ Flags list displays
- ✅ Status updates work
- ✅ Resolution notes save
- ✅ Filtering works

---

### Test ID: ADM3 - Audit Logs
**Priority:** 🟡 MEDIUM  
**Status:** ✅ Ready to Test

**Steps:**
1. Login as admin
2. Navigate to `/admin/audit-logs`
3. View audit logs
4. Test filtering:
   - By action type
   - By resource type
   - By user
5. Verify logs display correctly

**Expected Results:**
- ✅ Audit logs display
- ✅ Filtering works
- ✅ Logs are comprehensive
- ✅ Timestamps are correct

---

### Test ID: ADM4 - AI Usage Reporting
**Priority:** 🟠 HIGH  
**Status:** ✅ Ready to Test

**Steps:**
1. Login as admin
2. Navigate to `/admin/ai-usage`
3. View tabs:
   - Usage by User
   - Usage by Tier
   - Errors
4. Test search and filtering
5. Verify data displays correctly

**Expected Results:**
- ✅ All tabs display correctly
- ✅ Search works
- ✅ Data is accurate
- ✅ Warnings show for low usage

---

### Test ID: ADM5 - Email Diagnostics
**Priority:** 🟠 HIGH  
**Status:** ✅ Ready to Test

**Steps:**
1. Login as admin
2. Navigate to `/admin`
3. Click "Send Test Email to Myself"
4. Verify email sent
5. Check email inbox
6. Verify test emails received

**Expected Results:**
- ✅ Test email button works
- ✅ Magic link email sent
- ✅ Password reset email sent
- ✅ Emails received correctly

---

## 🌐 Browser Compatibility

### Test ID: B1 - Chrome
**Priority:** 🟡 MEDIUM  
**Status:** ✅ Ready to Test

**Steps:**
1. Open site in Chrome
2. Test key features:
   - Search autocomplete
   - Map functionality
   - Forms
   - Navigation
3. Verify no console errors

**Expected Results:**
- ✅ All features work
- ✅ No console errors
- ✅ Performance is good

---

### Test ID: B2 - Firefox
**Priority:** 🟡 MEDIUM  
**Status:** ✅ Ready to Test

**Steps:**
1. Open site in Firefox
2. Test key features:
   - Search autocomplete
   - Map functionality
   - Forms
   - Navigation
3. Verify no console errors

**Expected Results:**
- ✅ All features work
- ✅ Autocomplete works (fixes applied)
- ✅ No console errors

---

### Test ID: B3 - Safari
**Priority:** 🟡 MEDIUM  
**Status:** ✅ Ready to Test

**Steps:**
1. Open site in Safari
2. Test key features:
   - Search autocomplete
   - Map functionality
   - Forms
   - Navigation
3. Verify no console errors

**Expected Results:**
- ✅ All features work
- ✅ Autocomplete works (fixes applied)
- ✅ No console errors

---

## 🧪 New Features (This Session)

### Test ID: NF1 - Pre-Launch Checklist Script
**Priority:** 🟡 MEDIUM  
**Status:** ✅ Ready to Test

**Steps:**
1. Run `pnpm prelaunch-check`
2. Review output
3. Verify all checks run
4. Fix any errors
5. Verify warnings are acceptable

**Expected Results:**
- ✅ Script runs without errors
- ✅ All checks execute
- ✅ Output is clear and actionable
- ✅ No false positives

---

### Test ID: NF2 - API Client Abstraction
**Priority:** 🟡 MEDIUM  
**Status:** ✅ Ready to Test

**Steps:**
1. Verify API client exists (`app/lib/api/client.ts`)
2. Test API client usage:
   ```typescript
   import { getApiClient } from '@/lib/api/client';
   const api = getApiClient();
   const response = await api.get('/api/health');
   ```
3. Verify works in browser

**Expected Results:**
- ✅ API client exists
- ✅ Can import and use
- ✅ Requests work correctly
- ✅ Error handling works

---

### Test ID: NF3 - Storage Abstraction
**Priority:** 🟡 MEDIUM  
**Status:** ✅ Ready to Test

**Steps:**
1. Verify storage service exists (`app/lib/storage/index.ts`)
2. Test storage usage:
   ```typescript
   import { storage } from '@/lib/storage';
   await storage.setJSON('test', { key: 'value' });
   const data = await storage.getJSON('test');
   ```
3. Verify works in browser

**Expected Results:**
- ✅ Storage service exists
- ✅ Can import and use
- ✅ JSON serialization works
- ✅ Data persists

---

### Test ID: NF4 - UI Components
**Priority:** 🟡 MEDIUM  
**Status:** ✅ Ready to Test

**Steps:**
1. Verify UI components exist (`app/components/ui/`)
2. Test component usage:
   ```typescript
   import { Button, Input, Select } from '@/components/ui';
   ```
3. Verify components render
4. Test component props

**Expected Results:**
- ✅ Components exist
- ✅ Can import and use
- ✅ Components render correctly
- ✅ Props work as expected

---

## 📋 Test Execution Summary

### Critical Tests (Must Pass)
- A1-A5: Authentication flows
- L1-L3: Listings core functionality
- P1: Stripe checkout
- M1: Messaging
- T1: Watchlist (needs fix)

### High Priority Tests (Should Pass)
- L4-L5: Listings features
- P2: Subscription management
- M2-M3: Messaging features
- N1-N2: Notifications
- T2-T4: Tools
- MOB1-MOB3: Mobile experience
- ADM1-ADM5: Admin features

### Medium Priority Tests (Nice to Have)
- B1-B3: Browser compatibility
- NF1-NF4: New features

---

## 🚨 Known Issues to Watch For

1. **Watchlist Display** - Saved properties not showing in UI
2. **Email Delivery** - Requires Supabase SMTP configuration
3. **Mobile Auth Flicker** - Should be fixed but verify
4. **Map Performance** - Monitor on slower devices

---

## 📝 Test Results Template

```
Test ID: [ID]
Tester: [Name]
Date: [Date]
Environment: [Local/Staging/Production]
Browser/Device: [Details]

Results:
- ✅ Pass
- ⚠️ Warning
- ❌ Fail

Notes:
[Any additional notes]
```

---

**Last Updated:** February 2025  
**Next Review:** After deployment

