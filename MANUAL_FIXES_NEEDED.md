# Manual Fixes Needed - Step by Step Guide

## 🚨 **CRITICAL FIXES (Do These First)**

### 1. **Fix Loading Issues (Listings & Account Pages)**
**Issue**: Pages stuck on "Loading..." require refresh
**Status**: Will be fixed in code - no manual action needed

### 2. **Fix 404 Errors**
**Issue**: Some links return 404

**Actions Needed:**
- **AI Analyzer**: The link points to `/analyzer` but should be `/tools/analyzer`
  - **Fix**: Update admin dashboard links (will fix in code)

- **Contact Sales**: Should work at `/contact-sales` 
  - **Check**: Verify file exists at `app/contact-sales/page.tsx`
  - **Status**: Should already exist - will verify

### 挺好的. **Fix Pricing Page Upgrade Buttons**
**Issue**: Upgrade buttons not working

**Check:**
1. Open browser DevTools → Network tab
2. Click "Upgrade to Basic" button
3. Check for errors in console
4. Check if API request is being made to `/api/billing/create-checkout-session`

**Likely Issue**: Stripe API keys not configured or API route error
**Fix**: Will update code to handle errors better

### 4. **Fix Search Functionality**
**Issue**: Search doesn't move map to location
**Status**: Will implement geocoding to move map to searched location

### 5. **Fix Map Flickering & Draw Area Disappearing**
**Issue**: Map flickers and draw area disappears
**Status**: Will improve debouncing and prevent draw area reset on map updates

---

## 🔧 **CODE FIXES I'LL HANDLE**

### **1. Loading State Management**
- Fix early returns that might skip `setLoading(false)`
- Add error boundaries
- Add timeout handling

### **2. Map Flickering**
- Increase debounce delays further
- Prevent map re-initialization during bounds updates
- Preserve draw area state during updates

### **3. Routing Fixes**
- Fix AI Analyzer link in admin dashboard
- Verify Contact Sales route
- Implement messaging route

### **4. UI Improvements**
- Hide "My Listings" and "Post a Deal" for investors
- Update account page to show correct features based on subscription
- Make analytics pages more professional
- Add investor-specific analytics

### **5. Search Implementation**
- Implement geocoding API call
- Move map to searched location
- Show search results on map

### **6. Messaging System**
- Create messaging pages and API
- Implement internal messaging
- Add notification system

---

## 📋 **WHAT YOU NEED TO DO MANUALLY**

### **1. Verify Environment Variables**
Check your `.env.local` file has:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your_map_id
STRIPE_SECRET_KEY=your_stripe_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### **2. Test Stripe Integration**
1. Go to Stripe Dashboard → Products
2. Verify you have products created for:
   - Investor Basic (monthly & yearly)
   - Investor Pro (monthly & yearly)
   - Wholesaler Basic (monthly & yearly)
   - Wholesaler Pro (monthly & yearly)
3. Copy the Price IDs to your `.env.local`:
```bash
STRIPE_PRICE_INVESTOR_BASIC=price_xxx
STRIPE_PRICE_INVESTOR_PRO=price_xxx
STRIPE_PRICE_INVESTOR_BASIC_YEARLY=price_xxx
STRIPE_PRICE_INVESTOR_PRO_YEARLY=price_xxx
STRIPE_PRICE_WHOLESALER_BASIC=price_xxx
STRIPE_PRICE_WHOLESALER_PRO=price_xxx
STRIPE_PRICE_WHOLESALER_BASIC_YEARLY=price_xxx
STRIPE_PRICE_WHOLESALER_PRO_YEARLY=price_xxx
```

### **3. Set Up Webhook Endpoint in Stripe**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/billing/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## 🎯 **PRIORITY ORDER**

1. ✅ Fix loading issues (automatic)
2. ✅ Fix map flickering (automatic)
3. ✅ Fix routing/404 errors (automatic)
4. ⚠️ Configure Stripe (MANUAL - see above)
5. ✅ Fix UI issues (automatic)
6. ✅ Implement search (automatic)
7. ✅ Implement messaging (automatic)

---

**I'll handle all the code fixes. You just need to:**
1. Verify environment variables
2. Set up Stripe products and webhook
3. Test after I make the code changes

