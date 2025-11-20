# Unified Pricing Implementation Summary

## Changes Completed

### 1. Pricing Structure Updates

**Unified Monthly Pricing:**
- Basic: $35/month (for both investors and wholesalers)
- Pro: $60/month (for both investors and wholesalers)

**Unified Yearly Pricing (11 months = 1 month free):**
- Basic: $385/year (11 × $35)
- Pro: $660/year (11 × $60)

### 2. Files Updated

#### `app/lib/stripe.ts`
- ✅ Updated `STRIPE_PLANS` prices:
  - `INVESTOR_BASIC`: $29 → $35
  - `INVESTOR_PRO`: $59 → $60
  - `WHOLESALER_BASIC`: $49 → $35
  - `WHOLESALER_PRO`: $99 → $60
- ✅ Added comments indicating unified pricing
- ✅ Price ID mapping functions unchanged (still role-specific for Stripe)

#### `app/lib/pricing.ts`
- ✅ Updated plan prices:
  - `investor_basic`: $29/$313 → $35/$385
  - `investor_pro`: $59/$637 → $60/$660
  - `wholesaler_basic`: $25/$270 → $35/$385
  - `wholesaler_pro`: $59/$637 → $60/$660
- ✅ Added comments indicating unified pricing

#### `app/pricing/page.tsx`
- ✅ Updated displayed prices:
  - Investor Basic: $29/$290 → $35/$385
  - Investor Pro: $59/$590 → $60/$660
  - Wholesaler Basic: $25/$250 → $35/$385
  - Wholesaler Pro: $59/$590 → $60/$660
- ✅ Added yearly savings text: "(11 months, save $X)"

#### `app/api/billing/create-checkout-session/route.ts`
- ✅ **CRITICAL:** Added role validation to prevent mismatches
  - Checks user's profile `segment` or `role` matches requested `segment`
  - Returns 403 error if mismatch (unless admin)
  - Prevents investors from buying wholesaler plans and vice versa
- ✅ Enhanced metadata:
  - Added `subscription_role` and `subscription_tier` to ensure consistency
  - Added `user_role` for tracking
  - Added `profile_segment` for debugging

### 3. Role-Tier Enforcement

**Validation Logic:**
```typescript
const userRole = profile?.segment || profile?.role;
const isAdmin = userRole === 'admin';

if (!isAdmin && userRole !== segment) {
  return 403 error: "Role mismatch: You are registered as {userRole}, but trying to purchase {segment} plan."
}
```

**This ensures:**
- Investors can only purchase investor plans
- Wholesalers can only purchase wholesaler plans
- Admins can purchase any plan (for testing/support)
- Role and tier remain consistently linked in:
  - Checkout session metadata
  - Profile updates (via webhooks)
  - Subscription records

### 4. Webhook Handlers (Already Correct)

The existing webhook handlers in:
- `app/api/stripe/webhook/route.ts`
- `app/api/billing/webhook/route.ts`

Already correctly:
- Extract `segment` and `tier` from price ID using `getPlanFromPriceId()`
- Update `profiles` table with `segment` and `tier`
- Store `active_price_id` for tracking

**No changes needed** - webhooks will automatically work with new price IDs.

### 5. Documentation Created

- ✅ `docs/STRIPE_PRICE_IDS_UPDATE.md` - Complete guide for updating Stripe Price IDs in Vercel

## Next Steps (Required)

### 1. Update Stripe Price IDs in Vercel

**Action Required:** Update environment variables in Vercel with new Stripe Price IDs.

See `docs/STRIPE_PRICE_IDS_UPDATE.md` for detailed instructions.

**Environment Variables to Update:**
- `STRIPE_PRICE_INVESTOR_BASIC` → New $35/month price ID
- `STRIPE_PRICE_INVESTOR_PRO` → New $60/month price ID
- `STRIPE_PRICE_WHOLESALER_BASIC` → New $35/month price ID
- `STRIPE_PRICE_WHOLESALER_PRO` → New $60/month price ID
- `STRIPE_PRICE_INVESTOR_BASIC_YEARLY` → New $385/year price ID
- `STRIPE_PRICE_INVESTOR_PRO_YEARLY` → New $660/year price ID
- `STRIPE_PRICE_WHOLESALER_BASIC_YEARLY` → New $385/year price ID
- `STRIPE_PRICE_WHOLESALER_PRO_YEARLY` → New $660/year price ID

### 2. Create New Prices in Stripe Dashboard

1. **For each plan** (Investor Basic, Investor Pro, Wholesaler Basic, Wholesaler Pro):
   - Create monthly price: $35 (Basic) or $60 (Pro)
   - Create yearly price: $385 (Basic) or $660 (Pro)
   - Copy Price IDs
   - Archive old prices (don't delete)

2. **Update Vercel environment variables** with new Price IDs

3. **Redeploy application**

### 3. Testing Checklist

After updating Price IDs and redeploying:

- [ ] **Investor Basic Monthly:** Create checkout, verify $35/month, verify role stored correctly
- [ ] **Investor Basic Yearly:** Create checkout, verify $385/year, verify role stored correctly
- [ ] **Investor Pro Monthly:** Create checkout, verify $60/month, verify role stored correctly
- [ ] **Investor Pro Yearly:** Create checkout, verify $660/year, verify role stored correctly
- [ ] **Wholesaler Basic Monthly:** Create checkout, verify $35/month, verify role stored correctly
- [ ] **Wholesaler Basic Yearly:** Create checkout, verify $385/year, verify role stored correctly
- [ ] **Wholesaler Pro Monthly:** Create checkout, verify $60/month, verify role stored correctly
- [ ] **Wholesaler Pro Yearly:** Create checkout, verify $660/year, verify role stored correctly
- [ ] **Role Mismatch Test 1:** Investor tries to buy Wholesaler Basic → Should return 403 error
- [ ] **Role Mismatch Test 2:** Wholesaler tries to buy Investor Pro → Should return 403 error
- [ ] **Profile Update:** After successful checkout, verify `profiles.segment` and `profiles.tier` are correct
- [ ] **Subscription Metadata:** Verify Stripe checkout session metadata includes correct `subscription_role` and `subscription_tier`

## Key Features

### ✅ Unified Pricing
- Same prices for investors and wholesalers
- Simplified pricing structure
- Clear value proposition

### ✅ Role-Tier Enforcement
- Server-side validation prevents mismatches
- Consistent role + tier storage
- Admin override for support/testing

### ✅ Yearly Discount
- 11 months pricing (1 month free)
- Clear savings messaging
- Automatic calculation

### ✅ Backward Compatible
- Existing Stripe logic unchanged
- Webhook handlers work automatically
- No breaking changes to subscription flow

## Security Notes

1. **Role Validation:** Server-side check prevents role mismatches at checkout
2. **Metadata Tracking:** All checkout sessions include role/tier for audit trail
3. **Profile Updates:** Webhooks automatically update profiles with correct segment/tier
4. **RLS Policies:** Existing RLS policies will continue to work with updated segment/tier values

## Rollback Plan

If issues occur:
1. Revert Vercel environment variables to old Price IDs
2. Redeploy application
3. Old prices will continue to work for existing subscriptions
4. Code changes are backward compatible

---

**Implementation Date:** November 19, 2025  
**Status:** ✅ Code Complete - Awaiting Stripe Price ID Updates

