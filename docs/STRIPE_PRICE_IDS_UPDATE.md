# Stripe Price IDs Update Guide

## Overview

This document outlines the required updates to Stripe Price IDs in Vercel environment variables to align with the unified pricing structure.

## New Pricing Structure

### Monthly Pricing (Unified)
- **Basic:** $35/month (for both investors and wholesalers)
- **Pro:** $60/month (for both investors and wholesalers)

### Yearly Pricing (11 months = 1 month free)
- **Basic:** $385/year (11 × $35)
- **Pro:** $660/year (11 × $60)

## Required Environment Variables

Update the following environment variables in Vercel:

### Monthly Prices
```
STRIPE_PRICE_INVESTOR_BASIC=<new_price_id_for_$35_monthly_investor>
STRIPE_PRICE_INVESTOR_PRO=<new_price_id_for_$60_monthly_investor>
STRIPE_PRICE_WHOLESALER_BASIC=<new_price_id_for_$35_monthly_wholesaler>
STRIPE_PRICE_WHOLESALER_PRO=<new_price_id_for_$60_monthly_wholesaler>
```

### Yearly Prices
```
STRIPE_PRICE_INVESTOR_BASIC_YEARLY=<new_price_id_for_$385_yearly_investor>
STRIPE_PRICE_INVESTOR_PRO_YEARLY=<new_price_id_for_$660_yearly_investor>
STRIPE_PRICE_WHOLESALER_BASIC_YEARLY=<new_price_id_for_$385_yearly_wholesaler>
STRIPE_PRICE_WHOLESALER_PRO_YEARLY=<new_price_id_for_$660_yearly_wholesaler>
```

## Steps to Update Stripe Prices

### Option 1: Create New Prices in Stripe Dashboard

1. **Log into Stripe Dashboard**
2. **Navigate to:** Products → Create Product
3. **For each plan:**
   - Create product: "Off Axis Deals - Investor Basic" (or Wholesaler Basic/Pro)
   - Add price: $35/month (recurring, monthly)
   - Add price: $385/year (recurring, yearly)
   - Copy the Price IDs
   - Repeat for all 4 plans (Investor Basic, Investor Pro, Wholesaler Basic, Wholesaler Pro)

### Option 2: Update Existing Prices (if keeping same products)

1. **Navigate to:** Products → Select existing product
2. **For each price:**
   - Edit the price amount
   - Update monthly: $35 (Basic) or $60 (Pro)
   - Update yearly: $385 (Basic) or $660 (Pro)
   - Note: Stripe doesn't allow editing price amounts directly
   - **You must create new prices** and archive old ones

### Recommended Approach: Create New Prices

Since Stripe doesn't allow editing price amounts, create new prices:

1. **Create new prices** with the correct amounts
2. **Archive old prices** (don't delete - keep for historical records)
3. **Update environment variables** in Vercel with new Price IDs
4. **Test checkout flow** with a test user

## Price ID Mapping

| Plan | Monthly Price | Yearly Price | Monthly Price ID | Yearly Price ID |
|------|---------------|--------------|------------------|-----------------|
| Investor Basic | $35 | $385 | `STRIPE_PRICE_INVESTOR_BASIC` | `STRIPE_PRICE_INVESTOR_BASIC_YEARLY` |
| Investor Pro | $60 | $660 | `STRIPE_PRICE_INVESTOR_PRO` | `STRIPE_PRICE_INVESTOR_PRO_YEARLY` |
| Wholesaler Basic | $35 | $385 | `STRIPE_PRICE_WHOLESALER_BASIC` | `STRIPE_PRICE_WHOLESALER_BASIC_YEARLY` |
| Wholesaler Pro | $60 | $660 | `STRIPE_PRICE_WHOLESALER_PRO` | `STRIPE_PRICE_WHOLESALER_PRO_YEARLY` |

## Important Notes

1. **Role-Tier Enforcement:** The checkout API now validates that a user's role (investor/wholesaler) matches the segment they're trying to purchase. This prevents mismatches.

2. **Metadata:** Checkout sessions include metadata:
   - `subscription_role`: The role (investor/wholesaler) for this subscription
   - `subscription_tier`: The tier (basic/pro) for this subscription
   - `user_role`: The user's current role from profile

3. **Webhook Updates:** The webhook handlers (`app/api/stripe/webhook/route.ts` and `app/api/billing/webhook/route.ts`) automatically update the `profiles` table with the correct `segment` and `tier` based on the price ID.

4. **Testing:** After updating Price IDs:
   - Test investor checkout (Basic and Pro, monthly and yearly)
   - Test wholesaler checkout (Basic and Pro, monthly and yearly)
   - Verify role mismatch is blocked (investor trying to buy wholesaler plan)
   - Verify profile updates correctly after successful checkout

## Migration Checklist

- [ ] Create new Stripe prices with correct amounts
- [ ] Archive old Stripe prices (keep for history)
- [ ] Update Vercel environment variables with new Price IDs
- [ ] Redeploy application
- [ ] Test investor Basic monthly checkout
- [ ] Test investor Basic yearly checkout
- [ ] Test investor Pro monthly checkout
- [ ] Test investor Pro yearly checkout
- [ ] Test wholesaler Basic monthly checkout
- [ ] Test wholesaler Basic yearly checkout
- [ ] Test wholesaler Pro monthly checkout
- [ ] Test wholesaler Pro yearly checkout
- [ ] Verify role mismatch blocking (investor → wholesaler plan)
- [ ] Verify role mismatch blocking (wholesaler → investor plan)
- [ ] Verify profile updates after checkout (segment + tier)
- [ ] Verify subscription metadata in Stripe dashboard

## Rollback Plan

If issues occur:
1. Revert Vercel environment variables to old Price IDs
2. Redeploy application
3. Old prices will continue to work for existing subscriptions
4. New subscriptions will use old prices until fixed

