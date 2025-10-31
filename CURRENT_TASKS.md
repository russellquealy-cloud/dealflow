# Current Tasks - Action Plan

## ✅ **COMPLETED (Don't Need to Worry About)**

1. ✅ Loading issues fixed (listings & account pages)
2. ✅ Search functionality working (geocoding moves map)
3. ✅ Investor UI fixed (hidden irrelevant buttons)
4. ✅ Admin dashboard links fixed
5. ✅ Account page dynamic features (shows correct plan/features)
6. ✅ Messaging system created (API + pages)
7. ✅ SQL migration fixed (owner_id corrected)

---

## 🔧 **YOUR TASKS (Manual Configuration)**

### **1. Stripe Configuration** ⚠️ CRITICAL

**Status**: Monthly prices configured ✅ | Yearly prices needed ⏳

**What to do:**
1. Go to Stripe Dashboard → Products
2. For each product (Investor Basic, Investor Pro, Wholesaler Basic, Wholesaler Pro):
   - Create **yearly pricing option** (if not already created)
   - Note the **Price IDs** (starts with `price_`)

3. Add to your `.env.local` file:
   ```bash
   # Monthly (already done ✅)
   STRIPE_PRICE_INVESTOR_BASIC=price_xxxxx
   STRIPE_PRICE_INVESTOR_PRO=price_xxxxx
   STRIPE_PRICE_WHOLESALER_BASIC=price_xxxxx
   STRIPE_PRICE_WHOLESALER_PRO=price_xxxxx
   
   # Yearly (need to add ⏳)
   STRIPE_PRICE_INVESTOR_BASIC_YEARLY=price_xxxxx
   STRIPE_PRICE_INVESTOR_PRO_YEARLY=price_xxxxx
   STRIPE_PRICE_WHOLESALER_BASIC_YEARLY=price_xxxxx
   STRIPE_PRICE_WHOLESALER_PRO_YEARLY=price_xxxxx
   ```

4. **Stripe Webhook** (if not done yet):
   - Dashboard → Developers → Webhooks
   - Endpoint: `https://your-domain.com/api/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
   - Copy webhook secret to `.env.local`: `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`

### **2. Test the New Features**

**Messaging:**
- [ ] Click "Message Seller" on a listing
- [ ] Send a test message
- [ ] Verify messages load correctly

**Account Page:**
- [ ] Check that your plan shows correctly
- [ ] Verify features list matches your subscription
- [ ] Test the upgrade button (should link to correct pricing tier)

**Search:**
- [ ] Search for a city/address
- [ ] Verify map moves to that location

---

## 💻 **MY TASKS (Code Fixes)**

### **1. Map Flickering** 🔄 IN PROGRESS

**Status**: Improved but may need more tuning

**What I'll do:**
- Further increase debounce delays if needed
- Improve draw area persistence
- Test and refine

### **2. Pricing Upgrade Buttons** ⏳ WAITING ON STRIPE

**Status**: Code ready, needs Stripe prices configured

**What I'll verify:**
- Once yearly prices are in `.env.local`, test the upgrade flow
- Fix any issues that come up

### **3. Analytics Dashboard Buttons** 📊 TODO

**What I'll do:**
- Make analytics buttons functional (Price Trends, User Engagement, Property Analytics)
- Add real data connections
- Improve UI polish

### **4. UI Polish** 🎨 TODO

**What I'll do:**
- Make pages more professional/polished
- Improve styling consistency
- Add better visual hierarchy

---

## 📋 **PRIORITY ORDER**

### **IMMEDIATE (Do First):**
1. ✅ SQL migration (DONE - you ran it)
2. ⚠️ **Add yearly Stripe prices** (YOU - needed for pricing page to work fully)
3. 🧪 **Test messaging system** (YOU - verify it works)
4. 🧪 **Test account page** (YOU - verify features show correctly)

### **NEXT (After Testing):**
5. 📊 Analytics buttons functionality (ME)
6. 🎨 UI polish improvements (ME)
7. 🔄 Map flickering final fix (ME)

### **LATER (Nice to Have):**
8. 📱 Mobile app improvements
9. 🔔 Push notifications for messages
10. 📈 Advanced analytics features

---

## 🐛 **KNOWN ISSUES TO WATCH**

1. **Map flickering** - Improved but may still occur occasionally
2. **Draw area disappearing** - May happen on map updates (related to flickering)
3. **Analytics buttons** - Currently not functional (will fix)
4. **Contact Sales** - May still show 404 (need to verify route)

---

## ✅ **NEXT STEPS FOR YOU RIGHT NOW**

1. **Add yearly Stripe prices to `.env.local`** (15 minutes)
2. **Test messaging** - Click "Message Seller" and send a test message (5 minutes)
3. **Test account page** - Check your subscription shows correctly (2 minutes)
4. **Report back** - Let me know if anything doesn't work

---

## 📝 **QUICK REFERENCE**

**Files Changed Recently:**
- `app/account/page.tsx` - Dynamic features display
- `app/api/messages/route.ts` - Messaging API
- `app/messages/[listingId]/page.tsx` - Messaging page
- `app/components/ContactButtons.tsx` - Now uses internal messaging
- `supabase/sql/add_messaging_support.sql` - SQL migration (✅ ran successfully)

**Environment Variables Needed:**
- Monthly Stripe prices ✅
- Yearly Stripe prices ⏳
- Stripe webhook secret ✅ (if configured)

---

**Let me know:**
- ✅ When yearly prices are added
- ✅ If messaging works
- ✅ If account page looks good
- ❌ Any errors or issues

Then I'll continue with analytics buttons and UI polish!

