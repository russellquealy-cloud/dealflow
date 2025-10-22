# DealFlow Testing Checklist

## Overview
This checklist will help verify all features are working correctly on both web and mobile platforms.

---

## 🔐 Authentication & User Management

### Sign In / Sign Up
- [ ] Sign up with new account (password method)
- [ ] Sign in with existing account (password method)
- [ ] Magic link sign-in works (check email delivery)
- [ ] Session persists after closing browser
- [ ] Session persists on mobile devices
- [ ] Sign out works correctly
- [ ] Redirect to intended page after login works

### Mobile Authentication
- [ ] Login works on mobile browsers (iOS Safari)
- [ ] Login works on mobile browsers (Android Chrome)
- [ ] Session cookies persist on mobile
- [ ] No need to re-login after closing mobile browser

---

## 🗺️ Map Functionality

### Pin Rendering
- [ ] Pins appear on the map for all listings
- [ ] Pins cluster together when zoomed out
- [ ] Cluster numbers show correctly (small/medium/large)
- [ ] Clicking clusters zooms in to expand
- [ ] Individual pins show when zoomed in
- [ ] Clicking pin navigates to listing detail page
- [ ] Price tooltips appear on hover

### Map Bounds Filtering
- [ ] Panning map updates visible listings
- [ ] Zooming in reduces visible listings to current area
- [ ] Zooming out shows more listings
- [ ] Map remembers last position (doesn't snap back)
- [ ] Listings only show for current map view (e.g., Tucson doesn't show Phoenix)
- [ ] Zoom message appears when too far out: "🔍 Zoom in to filter properties by area"
- [ ] City-level viewing works (zoom level 8-13)

### Drawing Tools
- [ ] Drawing toolbar appears in top-right corner
- [ ] Can draw polygon shape
- [ ] Can draw rectangle shape
- [ ] Can draw circle shape
- [ ] Drawing shape filters listings to that area only
- [ ] Editing shape updates filtered listings
- [ ] Deleting shape resets to map bounds
- [ ] Drawing tools work on mobile (touch-enabled)

---

## 📋 Listings & Filters

### Listing Display
- [ ] Listing cards show images
- [ ] Listing cards show bed/bath/sqft info
- [ ] Listing cards show price
- [ ] Listing cards show address/city
- [ ] All listings load initially
- [ ] Listings update when filters change

### Filters
- [ ] Sort dropdown works (newest, price, sqft)
- [ ] Price min/max filters work
- [ ] Beds min/max filters work
- [ ] Baths min/max filters work
- [ ] Sqft min/max filters work
- [ ] Filters don't clear out all listings inappropriately
- [ ] Reset button clears all filters
- [ ] Filters work in combination

### Search
- [ ] Search by city name works
- [ ] Search by address works
- [ ] Search by ZIP code works
- [ ] Search by state works
- [ ] Search updates map position
- [ ] Reset button clears search

---

## 📱 Mobile Experience

### Layout & Navigation
- [ ] Map/List toggle buttons show on mobile
- [ ] Map View button switches to map
- [ ] List View button switches to listings
- [ ] Map doesn't extend past bottom of page
- [ ] Filters don't show behind map
- [ ] Can't click map through filters
- [ ] No horizontal scrolling
- [ ] All buttons are touch-friendly (48px+ tap targets)

### Responsive Design
- [ ] Works on iPhone (iOS Safari)
- [ ] Works on Android (Chrome)
- [ ] Works on tablets (iPad, Android)
- [ ] Text is readable without zooming
- [ ] Inputs don't trigger zoom on focus
- [ ] All content fits within viewport

---

## 💰 Pricing Page

### User Type Tabs
- [ ] "All Plans" tab shows all 6 tiers
- [ ] "💼 Investors" tab shows Investor tiers + Free + Enterprise
- [ ] "🏡 Wholesalers" tab shows Wholesaler tiers + Free + Enterprise
- [ ] Tab switching works smoothly
- [ ] Popular badges show on correct tiers

### Pricing Tiers
- [ ] Free / Starter - $0/month displays correctly
- [ ] Investor Basic - $25/month displays correctly
- [ ] Investor Pro - $49/month displays correctly (marked popular)
- [ ] Wholesaler Basic - $25/month displays correctly
- [ ] Wholesaler Pro - $49/month displays correctly (marked popular)
- [ ] Enterprise / Team - $99+/month displays correctly
- [ ] All features listed correctly for each tier
- [ ] CTA buttons work for each tier
- [ ] Enterprise "Contact Sales" opens email

---

## 📝 Post a Deal

### Create Listing Form
- [ ] "Post a Deal" button redirects to form when logged in
- [ ] "Post a Deal" button redirects to login when not logged in
- [ ] Form displays properly on desktop
- [ ] Form displays properly on mobile
- [ ] All input fields work
- [ ] "Upload from Camera Roll" button works
- [ ] "Take Photo" button works (opens camera on mobile)
- [ ] Can select multiple photos
- [ ] Photo previews show correctly
- [ ] Can remove photos with ×  button
- [ ] Form submits successfully
- [ ] Success message appears
- [ ] New listing appears on map
- [ ] New listing appears in list

---

## 🏠 Listing Detail Page

### Display
- [ ] All listing images show
- [ ] Images are square (not stretched)
- [ ] Can scroll through images horizontally
- [ ] Navigation arrows work
- [ ] Main image updates when clicking thumbnails
- [ ] All property details display (beds, baths, sqft, price, etc.)
- [ ] Description shows if available
- [ ] "Message Seller" button appears
- [ ] "Message Seller" opens email client
- [ ] Email pre-fills with property info
- [ ] "Back to Listings" button works

---

## 👤 User Profile & Account

### Account Page
- [ ] Displays user email
- [ ] Shows current subscription tier
- [ ] "Upgrade to Pro" button links to pricing
- [ ] Pro features section displays
- [ ] No "User ID" block shows
- [ ] Profile can be viewed

### Investor/Wholesaler Profiles
- [ ] Can create investor profile
- [ ] Can create wholesaler profile
- [ ] Profiles save successfully
- [ ] No "failed to update profile" errors
- [ ] Can edit profiles after creation

---

## 🔍 Map Bounds Filtering Debug

### Console Logs to Check
1. Open browser DevTools (F12)
2. Go to Console tab
3. Pan/zoom the map
4. Look for these logs:
   - `🗺️ Map bounds emitted:` (should show bounds)
   - `🗺️ Filtering listings for bounds size: X degrees`
   - `🗺️ ===MAP BOUNDS FILTERING RESULTS===`
   - `🗺️ Query returned: X listings`
   - `🗺️ Updating state with filtered data`
   - `🗺️ State updated successfully`

### Expected Behavior
- When zoomed out (country-level): "Map bounds too large (country-level), not filtering listings"
- When zoomed in (city-level): Listings should filter to visible area
- When panning: New listings appear, old ones disappear based on map view
- Bounds size should be between 0.01 and 10 degrees for filtering to work

---

## ✅ Admin Access Verification

### Your Account Should Have:
- [ ] Unlimited listing creation
- [ ] Access to all Pro features
- [ ] Access to AI analyzer
- [ ] Access to all filters
- [ ] No restrictions on viewing listings
- [ ] Ability to test all subscription tiers

---

## 🐛 Known Issues to Monitor

1. **Map Flickering**: If map flickers when changing filters, check console for errors
2. **Pin Clustering**: If cluster numbers don't appear, check if CSS loaded
3. **Mobile Session**: If logged out on mobile refresh, check cookie settings
4. **Drawing Tools**: If drawing toolbar doesn't appear, check browser console

---

## 📊 Performance Checks

- [ ] Initial page load < 3 seconds
- [ ] Map renders within 1 second
- [ ] Pins appear within 2 seconds
- [ ] Filter changes update < 1 second
- [ ] Search results appear < 2 seconds
- [ ] No console errors on any page
- [ ] No memory leaks (check DevTools Performance tab)

---

## 🚀 Mobile App Readiness

### PWA Features
- [ ] Viewport meta tags set correctly
- [ ] Apple Web App capable enabled
- [ ] Theme color displays in browser chrome
- [ ] No horizontal scrolling
- [ ] Touch gestures work smoothly
- [ ] Forms don't trigger unwanted zoom

### Conversion Readiness
- [ ] All features work without desktop-specific dependencies
- [ ] No Flash or Java requirements
- [ ] All assets load over HTTPS
- [ ] Offline behavior handled gracefully
- [ ] Location services can be requested

---

## 📝 Notes & Issues

Use this section to document any issues found during testing:

**Issue:** 
**Steps to Reproduce:**
**Expected Behavior:**
**Actual Behavior:**
**Screenshot/Video:**
**Priority:** (Critical/High/Medium/Low)

---

## ✅ Sign-Off

**Tested By:** ___________________________
**Date:** ___________________________
**Platform:** Desktop ☐ / Mobile ☐ / Both ☐
**Status:** Pass ☐ / Fail ☐ / Needs Review ☐

**Critical Issues Found:** ___________________________
**Ready for Launch:** Yes ☐ / No ☐

---

## 🎯 Next Steps

After completing this checklist:
1. Deploy to production/staging
2. Share with test users
3. Gather feedback
4. Implement payment integration (Stripe/PayPal)
5. Set up analytics (Google Analytics, Mixpanel)
6. Prepare for iOS/Android app conversion
7. Set up monitoring (Sentry, LogRocket)

