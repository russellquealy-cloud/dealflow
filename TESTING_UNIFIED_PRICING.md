# Testing Unified Pricing & Role-Tier Enforcement

## Quick Test Checklist

### ✅ Pre-Test Setup
- [x] Stripe Price IDs created with correct amounts ($35/$60 monthly, $385/$660 yearly)
- [x] Vercel environment variables updated with new Price IDs
- [x] Application redeployed with updated environment variables

### 🧪 Test Scenarios

#### 1. Investor Basic Monthly ($35/month)
- [ ] Navigate to `/pricing?segment=investor&tier=basic&period=monthly`
- [ ] Verify price displays as **$35/month**
- [ ] Click "Upgrade to Basic"
- [ ] Complete Stripe checkout
- [ ] Verify profile updated: `segment = 'investor'`, `tier = 'basic'`
- [ ] Verify subscription record created with correct `stripe_price_id`

#### 2. Investor Basic Yearly ($385/year)
- [ ] Navigate to `/pricing?segment=investor&tier=basic&period=yearly`
- [ ] Verify price displays as **$385/year (11 months, save $35)**
- [ ] Click "Upgrade to Basic"
- [ ] Complete Stripe checkout
- [ ] Verify profile updated: `segment = 'investor'`, `tier = 'basic'`
- [ ] Verify subscription record created with correct yearly `stripe_price_id`

#### 3. Investor Pro Monthly ($60/month)
- [ ] Navigate to `/pricing?segment=investor&tier=pro&period=monthly`
- [ ] Verify price displays as **$60/month**
- [ ] Click "Upgrade to Pro"
- [ ] Complete Stripe checkout
- [ ] Verify profile updated: `segment = 'investor'`, `tier = 'pro'`

#### 4. Investor Pro Yearly ($660/year)
- [ ] Navigate to `/pricing?segment=investor&tier=pro&period=yearly`
- [ ] Verify price displays as **$660/year (11 months, save $60)**
- [ ] Click "Upgrade to Pro"
- [ ] Complete Stripe checkout
- [ ] Verify profile updated: `segment = 'investor'`, `tier = 'pro'`

#### 5. Wholesaler Basic Monthly ($35/month)
- [ ] Navigate to `/pricing?segment=wholesaler&tier=basic&period=monthly`
- [ ] Verify price displays as **$35/month**
- [ ] Click "Upgrade to Basic"
- [ ] Complete Stripe checkout
- [ ] Verify profile updated: `segment = 'wholesaler'`, `tier = 'basic'`

#### 6. Wholesaler Basic Yearly ($385/year)
- [ ] Navigate to `/pricing?segment=wholesaler&tier=basic&period=yearly`
- [ ] Verify price displays as **$385/year (11 months, save $35)**
- [ ] Click "Upgrade to Basic"
- [ ] Complete Stripe checkout
- [ ] Verify profile updated: `segment = 'wholesaler'`, `tier = 'basic'`

#### 7. Wholesaler Pro Monthly ($60/month)
- [ ] Navigate to `/pricing?segment=wholesaler&tier=pro&period=monthly`
- [ ] Verify price displays as **$60/month**
- [ ] Click "Upgrade to Pro"
- [ ] Complete Stripe checkout
- [ ] Verify profile updated: `segment = 'wholesaler'`, `tier = 'pro'`

#### 8. Wholesaler Pro Yearly ($660/year)
- [ ] Navigate to `/pricing?segment=wholesaler&tier=pro&period=yearly`
- [ ] Verify price displays as **$660/year (11 months, save $60)**
- [ ] Click "Upgrade to Pro"
- [ ] Complete Stripe checkout
- [ ] Verify profile updated: `segment = 'wholesaler'`, `tier = 'pro'`

### 🔒 Role Mismatch Tests (Security)

#### 9. Investor Trying to Buy Wholesaler Plan
- [ ] Log in as investor user
- [ ] Navigate to `/pricing?segment=wholesaler&tier=basic`
- [ ] Click "Upgrade to Basic"
- [ ] **Expected:** API returns `403 Forbidden` with error message:
  ```
  "Role mismatch: You are registered as investor, but trying to purchase wholesaler plan. Please contact support if you need to change your account type."
  ```
- [ ] Verify checkout session is NOT created

#### 10. Wholesaler Trying to Buy Investor Plan
- [ ] Log in as wholesaler user
- [ ] Navigate to `/pricing?segment=investor&tier=pro`
- [ ] Click "Upgrade to Pro"
- [ ] **Expected:** API returns `403 Forbidden` with error message:
  ```
  "Role mismatch: You are registered as wholesaler, but trying to purchase investor plan. Please contact support if you need to change your account type."
  ```
- [ ] Verify checkout session is NOT created

### 📊 Verification Steps

#### After Successful Checkout:

1. **Check Supabase `profiles` table:**
   ```sql
   SELECT id, email, segment, tier, active_price_id, current_period_end
   FROM profiles
   WHERE id = '<user_id>';
   ```
   - Verify `segment` matches purchased plan (investor/wholesaler)
   - Verify `tier` matches purchased tier (basic/pro)
   - Verify `active_price_id` matches the Stripe Price ID used

2. **Check Supabase `subscriptions` table:**
   ```sql
   SELECT user_id, stripe_price_id, status, current_period_start, current_period_end
   FROM subscriptions
   WHERE user_id = '<user_id>';
   ```
   - Verify `stripe_price_id` matches the correct Price ID
   - Verify `status` is 'active'

3. **Check Stripe Dashboard:**
   - Navigate to Customers → Select customer
   - Verify subscription shows correct price ($35/$60 monthly or $385/$660 yearly)
   - Check subscription metadata:
     - `subscription_role` = investor or wholesaler
     - `subscription_tier` = basic or pro
     - `user_role` = matches profile role

### 🐛 Troubleshooting

#### Issue: Prices not displaying correctly
- **Check:** Browser cache - hard refresh (Ctrl+Shift+R)
- **Check:** Vercel deployment logs for environment variable loading
- **Check:** `app/pricing/page.tsx` has correct price values

#### Issue: Role mismatch error when it shouldn't
- **Check:** User's profile `segment` or `role` field in Supabase
- **Check:** API logs for the actual role value being compared
- **Note:** Admin users can bypass this check

#### Issue: Profile not updating after checkout
- **Check:** Stripe webhook is configured and receiving events
- **Check:** Webhook handler logs in Vercel
- **Check:** `app/api/stripe/webhook/route.ts` is processing `checkout.session.completed` events

#### Issue: Wrong price ID being used
- **Check:** Vercel environment variables are correctly set
- **Check:** No typos in environment variable names
- **Check:** Application was redeployed after env var changes

### ✅ Success Criteria

All tests pass when:
- ✅ All 8 pricing scenarios complete successfully
- ✅ Role mismatch tests return 403 errors as expected
- ✅ Profiles update with correct segment and tier
- ✅ Subscriptions created with correct Price IDs
- ✅ Stripe metadata includes correct role and tier
- ✅ No console errors or API errors

---

**Test Date:** _______________  
**Tester:** _______________  
**Results:** _______________

