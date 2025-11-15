# Pre-Launch Issues List - Off Axis Deals
**Generated:** November 14, 2025  
**Last Updated:** January 2025 (Post-QA Testing + Admin Security)  
**Target Launch:** Public Website Launch  
**Status:** 🟢 90% Complete - Critical issues must be resolved before launch

## ✅ Recent Fixes (Post-QA Testing)

### Test A2/A3 - Magic Link & Password Reset
**Status:** ✅ Fixed (Error Handling Improved)  
**Changes:**
- Added user-friendly error messages for magic link and password reset failures
- Improved error detection for rate limits, invalid emails, and server errors
- Added detailed logging for debugging email delivery issues
- **Note:** The 500 errors from Supabase auth endpoints indicate a Supabase SMTP configuration issue that needs to be resolved in Supabase dashboard (not a code issue)

### Test L1/L3 - Listings Search & Map Sync
**Status:** ✅ Fixed  
**Changes:**
- Fixed search geocoding to properly set map bounds and filter listings by location
- When searching for a location (e.g., "Miami"), the map now recenters and the list filters by map bounds
- Added map bounds filtering to `filteredListings` useMemo to ensure list matches map markers
- Clear separation between text search (for address/city matching) and map bounds filtering (for location-based search)

### Test MOB1 - Mobile Map Scroll
**Status:** ✅ Fixed  
**Changes:**
- Added `touchAction: 'none'` to map container CSS to prevent page scroll when panning map
- Single-finger panning now works correctly on mobile devices

### Test N1 - Notification Preferences
**Status:** ✅ Fixed  
**Changes:**
- Fixed 401 error by adding Authorization header with session token to API requests
- Clarified "Lead Messages" description to explain that offers are just messages
- Improved error handling and user feedback

### Test P1 - Stripe Checkout Descriptions
**Status:** ✅ Fixed  
**Changes:**
- Added product name and description generation based on segment (investor/wholesaler) and tier (basic/pro)
- Added customer email and invoice settings to checkout session
- Improved metadata for better tracking

### Test AMD1 - Admin Dashboard
**Status:** ✅ Fully Fixed  
**Changes:**
- Fixed admin role checking to use both `role` and `segment` fields
- Created helper functions for consistent admin checks
- Added server-side route protection (`app/admin/layout.tsx`) - prevents unauthorized access
- Added admin button in header (only shows for admin users)
- Created diagnostic and auto-fix endpoints for admin account issues
- Improved error page with fix instructions
- **Note:** Database update may still be needed - run `supabase/sql/fix_admin_account.sql` or use the auto-fix button

---

## 🔴 CRITICAL BLOCKERS (Must Fix Before Launch)

### 1. Email Delivery for Authentication
**Priority:** 🔴 CRITICAL  
**Impact:** Blocks user onboarding, password recovery, and admin access  
**Status:** Not Working
**Issues:**
- Password reset emails not being delivered
- Magic link emails not being delivered
- Admin cannot access admin panel without email verification

**Required Actions:**
- [ ] Verify SendGrid/Supabase email configuration
- [ ] Test email delivery in production environment
- [ ] Configure email templates for password reset
- [ ] Configure email templates for magic link
- [ ] Set up email domain authentication (SPF, DKIM, DMARC)
- [ ] Test email delivery end-to-end (signup, password reset, magic link)
- [ ] Add email delivery monitoring/alerting

**Estimated Time:** 1-2 days

---

### 2. Watchlist Display Issue
**Priority:** 🔴 CRITICAL  
**Impact:** Core feature broken - users cannot see saved properties  
**Status:** API may work but UI not displaying

**Issues:**
- Saved properties not showing in watchlist UI
- Users cannot access their saved deals
- May be API response format issue or frontend rendering issue

**Required Actions:**
- [ ] Investigate watchlist API response format
- [ ] Check frontend component data mapping
- [ ] Verify RLS policies allow proper data access
- [ ] Test watchlist save/display flow end-to-end
- [ ] Fix data display issue
- [ ] Add error handling and user feedback

**Estimated Time:** 1 day

---

## 🟠 HIGH PRIORITY (Should Fix Before Launch)

### 3. Mobile UX Improvements
**Priority:** 🟠 HIGH  
**Impact:** Poor mobile user experience  
**Status:** Needs review and fixes

**Issues:**
- Map/search components cramped on smaller viewports
- My Listings form spacing too tight on mobile
- Filter drawers need mobile optimization
- Mobile session restore occasionally flashes logged-out state
- Auth refresh race conditions on mobile

**Required Actions:**
- [ ] Review mobile layouts with screenshots (planned for this weekend)
- [ ] Fix My Listings edit form spacing on mobile
- [ ] Optimize filter drawers for mobile
- [ ] Fix mobile auth refresh flicker
- [ ] Test all core flows on mobile devices (iOS Safari, Android Chrome)
- [ ] Optimize touch targets and spacing
- [ ] Ensure all forms are mobile-friendly

**Estimated Time:** 2-3 days

---

### 4. Notification System Completion
**Priority:** 🟠 HIGH  
**Impact:** Users miss important updates  
**Status:** Partially complete

**Issues:**
- Event wiring missing for several flows:
  - Market trend notifications
  - Subscription renewal reminders
  - Feedback requests
  - Repair estimate completion
  - Performance alerts
- No navigation entry point to notification preferences
- Email delivery working for customer service/sales but not for all notification types

**Required Actions:**
- [ ] Wire notification events for buyer interest
- [ ] Wire notification events for market trends
- [ ] Wire notification events for subscription renewal
- [ ] Wire notification events for feedback requests
- [ ] Add navigation link to notification preferences in settings
- [ ] Test all notification triggers
- [ ] Ensure email delivery works for all notification types

**Estimated Time:** 2-3 days

---

### 5. Messaging Polish
**Priority:** 🟠 HIGH  
**Impact:** User experience degradation  
**Status:** Functional but needs polish

**Issues:**
- Visual read receipts not surfaced in UI
- Minor layout improvements needed
- Read-state indicator missing in thread view

**Required Actions:**
- [ ] Add read receipt indicators in message threads
- [ ] Improve messaging layout and spacing
- [ ] Add visual indicators for message read/unread status
- [ ] Test messaging flow on mobile

**Estimated Time:** 1 day

---

### 6. AI Usage Reporting
**Priority:** 🟠 HIGH  
**Impact:** Users cannot track their usage  
**Status:** Quotas enforced but not visible

**Issues:**
- AI usage not displayed in user UI
- Admin cannot see AI usage reports
- Users don't know how many AI analyses they have remaining

**Required Actions:**
- [ ] Add AI usage display to user account page
- [ ] Show remaining quota vs. used quota
- [ ] Add AI usage reporting to admin dashboard
- [ ] Display usage warnings when approaching limits

**Estimated Time:** 1 day

---

## 🟡 MEDIUM PRIORITY (Nice to Have Before Launch)

### 7. Saved Search UX Improvements
**Priority:** 🟡 MEDIUM  
**Impact:** Feature feels manual and clunky  
**Status:** Functional but needs UX work

**Issues:**
- Saved search UX feels too manual
- Mobile layout spacing needs review
- Could be more intuitive

**Required Actions:**
- [ ] Redesign saved search creation flow
- [ ] Add "Save current search" quick action
- [ ] Improve saved search management UI
- [ ] Optimize mobile layout

**Estimated Time:** 1-2 days

---

### 8. Monthly Cleanup Job for AI Usage
**Priority:** 🟡 MEDIUM  
**Impact:** Database growth over time  
**Status:** Function created but not scheduled

**Issues:**
- AI usage cleanup function exists but not scheduled
- Old records will accumulate without cleanup

**Required Actions:**
- [ ] Set up Supabase cron job for monthly cleanup
- [ ] OR set up Vercel cron job
- [ ] Test cleanup job execution
- [ ] Monitor cleanup job logs

**Estimated Time:** 0.5 days

---

### 9. Admin Tooling Expansion
**Priority:** 🟡 MEDIUM  
**Impact:** Support staff cannot effectively manage users  
**Status:** Basic dashboard only

**Issues:**
- User management is read-only
- No moderation tools
- No content/report workflow
- No system audit logs

**Required Actions:**
- [ ] Add user moderation actions (suspend, ban, verify)
- [ ] Add content moderation tools
- [ ] Create report workflow for flagged content
- [ ] Add system audit logs
- [ ] Add notification + AI usage reporting to admin

**Estimated Time:** 3-5 days

---

### 10. Browser Compatibility Testing
**Priority:** 🟡 MEDIUM  
**Impact:** Some users may have issues  
**Status:** Not fully tested

**Issues:**
- Autocomplete suggestions need verification across browsers
- Map components need testing on different browsers
- Some features may not work on older browsers

**Required Actions:**
- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Test on mobile browsers (iOS Safari, Android Chrome)
- [ ] Verify autocomplete works consistently
- [ ] Test map functionality across browsers
- [ ] Fix any browser-specific issues

**Estimated Time:** 1-2 days

---

## 🔵 LOW PRIORITY (Post-Launch)

### 11. Advanced Analytics Dashboard
**Priority:** 🔵 LOW  
**Impact:** Pro feature enhancement  
**Status:** Stub pages created, needs real data

**Issues:**
- Analytics pages are stubs
- Need PropStream integration for real data
- Need internal event tracking

**Required Actions:**
- [ ] Integrate PropStream API
- [ ] Add internal event tracking
- [ ] Populate analytics with real data
- [ ] Add charts and visualizations

**Estimated Time:** 1-2 weeks (depends on PropStream integration)

---

### 12. PDF Export
**Priority:** 🔵 LOW  
**Impact:** Feature enhancement  
**Status:** Not implemented

**Required Actions:**
- [ ] Add PDF export functionality
- [ ] Create PDF templates
- [ ] Add export options to analytics pages

**Estimated Time:** 2-3 days

---

### 13. Push Notifications & PWA
**Priority:** 🔵 LOW  
**Impact:** Mobile app-like experience  
**Status:** Not in scope yet

**Required Actions:**
- [ ] Set up push notification service
- [ ] Create PWA manifest
- [ ] Add service worker
- [ ] Enable offline functionality

**Estimated Time:** 1 week

---

## 📋 PRE-LAUNCH CHECKLIST

### Security & Compliance
- [ ] SSL certificate valid and auto-renewing
- [ ] All environment variables secured in Vercel
- [ ] RLS policies tested and verified
- [ ] API rate limiting configured
- [ ] CORS policies properly configured
- [ ] Input validation on all forms
- [ ] SQL injection protection verified
- [ ] XSS protection verified
- [ ] GDPR compliance (if applicable)
- [ ] Privacy policy and terms of service pages

### Performance
- [ ] Page load times < 3 seconds
- [ ] Image optimization enabled
- [ ] Code splitting implemented
- [ ] Database query optimization
- [ ] API response times acceptable
- [ ] Map rendering performance optimized
- [ ] Mobile performance tested

### Testing
- [ ] End-to-end testing of core flows:
  - [ ] User registration and login
  - [ ] Password reset flow
  - [ ] Magic link flow
  - [ ] Listing creation (wholesaler)
  - [ ] Listing viewing and filtering (investor)
  - [ ] Watchlist save/display
  - [ ] Messaging flow
  - [ ] Subscription upgrade flow
  - [ ] AI analyzer usage
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] Error handling testing
- [ ] Load testing (if applicable)

### Monitoring & Logging
- [ ] Error tracking set up (Sentry, etc.)
- [ ] Analytics tracking configured
- [ ] Log aggregation set up
- [ ] Uptime monitoring configured
- [ ] Alert system for critical errors
- [ ] Performance monitoring

### Documentation
- [ ] User documentation/help center
- [ ] API documentation (if public API)
- [ ] Admin documentation
- [ ] Deployment runbook
- [ ] Rollback procedures documented

### Marketing & Onboarding
- [ ] Landing page optimized
- [ ] Onboarding flow tested
- [ ] Email templates finalized
- [ ] Welcome emails configured
- [ ] Feature tour/tutorial (optional)

---

## 📊 ESTIMATED TIMELINE

### Phase 1: Critical Blockers (3-4 days)
- Email delivery: 1-2 days
- Watchlist display fix: 1 day
- **Total: 3-4 days**

### Phase 2: High Priority (5-7 days)
- Mobile UX improvements: 2-3 days
- Notification system completion: 2-3 days
- Messaging polish: 1 day
- AI usage reporting: 1 day
- **Total: 5-7 days**

### Phase 3: Medium Priority (5-8 days)
- Saved search UX: 1-2 days
- Cleanup job: 0.5 days
- Admin tooling: 3-5 days
- Browser testing: 1-2 days
- **Total: 5-8 days**

### Phase 4: Pre-Launch Checklist (3-5 days)
- Security audit: 1 day
- Performance optimization: 1 day
- Testing: 1-2 days
- Documentation: 1 day
- **Total: 3-5 days**

**Total Estimated Time to Launch-Ready: 16-24 days (3-5 weeks)**

---

## 🎯 RECOMMENDED LAUNCH SEQUENCE

1. **Week 1:** Fix critical blockers (email, watchlist)
2. **Week 2:** High priority items (mobile, notifications, messaging)
3. **Week 3:** Medium priority + testing
4. **Week 4:** Final polish, security audit, documentation
5. **Week 5:** Soft launch with limited users
6. **Week 6+:** Public launch after soft launch validation

---

## 📱 POST-LAUNCH: MOBILE APP ROADMAP

### Phase 1: Mobile Web Review (Week 1-2 Post-Launch)
- [ ] Comprehensive mobile UX review
- [ ] User testing on mobile devices
- [ ] Mobile-specific optimizations
- [ ] Touch gesture improvements
- [ ] Mobile performance optimization

### Phase 2: Native App Planning (Week 3-4)
- [ ] Choose framework (React Native, Expo, Flutter, etc.)
- [ ] Design native app architecture
- [ ] Plan API integration
- [ ] Design app store assets
- [ ] Set up development environment

### Phase 3: Native App Development (Week 5-12)
- [ ] Core features implementation
- [ ] Push notifications
- [ ] Offline functionality
- [ ] App store submission preparation
- [ ] Beta testing

### Phase 4: App Store Launch (Week 13-14)
- [ ] iOS App Store submission
- [ ] Google Play Store submission
- [ ] App store optimization
- [ ] Launch marketing

---

## 📝 NOTES

- **Current Status:** 88% complete, core features working
- **Biggest Risks:** Email delivery and watchlist display issues
- **Mobile App:** Not started - will begin after web launch is stable
- **Advanced Analytics:** Stub pages created, needs PropStream integration for real data
- **Admin Tools:** Basic functionality exists, needs expansion for support staff

---

**Last Updated:** November 14, 2025  
**Next Review:** After critical blockers are resolved

