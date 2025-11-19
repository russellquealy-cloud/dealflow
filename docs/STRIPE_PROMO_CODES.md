# Stripe Promo Codes - Setup Guide

## Overview
Promo codes are now enabled in Stripe checkout. Users can enter promo codes directly in the Stripe-hosted checkout page.

## Creating Test Promo Codes

### Step 1: Create a Coupon
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → **Coupons**
3. Click **"Create coupon"**

### Step 2: Configure the Coupon

**For Testing - Create these 4 test coupons:**

#### 1. Investor Basic - 10% Off (Monthly)
- **Name:** `TEST_INVESTOR_BASIC_MONTHLY`
- **Discount:** 10% off
- **Duration:** Once (applies to first payment only)
- **Redemption limits:** Unlimited
- **Applies to:** All products (or specific price IDs if needed)

#### 2. Investor Pro - 20% Off (Yearly)
- **Name:** `TEST_INVESTOR_PRO_YEARLY`
- **Discount:** 20% off
- **Duration:** Once (applies to first payment only)
- **Redemption limits:** Unlimited
- **Applies to:** All products (or specific price IDs if needed)

#### 3. Wholesaler Basic - 15% Off (Monthly)
- **Name:** `TEST_WHOLESALER_BASIC_MONTHLY`
- **Discount:** 15% off
- **Duration:** Once (applies to first payment only)
- **Redemption limits:** Unlimited
- **Applies to:** All products (or specific price IDs if needed)

#### 4. Wholesaler Pro - 25% Off (Yearly)
- **Name:** `TEST_WHOLESALER_PRO_YEARLY`
- **Discount:** 25% off
- **Duration:** Once (applies to first payment only)
- **Redemption limits:** Unlimited
- **Applies to:** All products (or specific price IDs if needed)

### Step 3: Create Promo Codes from Coupons
1. After creating each coupon, click on it
2. Click **"Create promotion code"**
3. Enter a simple code (e.g., `TEST10`, `TEST20`, `TEST15`, `TEST25`)
4. Set expiration (optional - leave blank for no expiration)
5. Set usage limits (optional - leave blank for unlimited)
6. Click **"Create promotion code"**

### Step 4: Test the Promo Codes
1. Start a checkout flow in your app
2. In the Stripe checkout page, click **"Add promotion code"** (or similar link)
3. Enter one of your test codes
4. Verify the discount applies correctly
5. Complete the checkout to verify the discount is applied to the subscription

## Important Notes

### Coupon vs Promotion Code
- **Coupon:** The discount configuration (percentage, amount, duration)
- **Promotion Code:** The code users enter (can have multiple codes per coupon)

### Duration Options
- **Once:** Discount applies to first payment only (good for trials)
- **Repeating:** Discount applies to each billing cycle (good for ongoing discounts)
- **Forever:** Discount applies indefinitely (use with caution)

### Testing in Test Mode
- All test coupons/promo codes work in Stripe test mode
- Test with test card: `4242 4242 4242 4242`
- Verify the discount appears in the checkout session

### Deleting Test Codes
1. Go to **Products** → **Coupons**
2. Find the test coupon
3. Click **"..."** → **"Delete"**
4. Confirm deletion

**Note:** You can also archive coupons instead of deleting them if you want to keep them for reference.

## Production Promo Codes

When creating production promo codes:
1. Use descriptive names (e.g., `LAUNCH_2025_20OFF`)
2. Set appropriate expiration dates
3. Set usage limits if needed
4. Test thoroughly before promoting
5. Monitor usage in Stripe Dashboard → **Products** → **Coupons** → **Usage**

## Troubleshooting

### Promo code field not appearing
- Verify `allow_promotion_codes: true` is set in checkout session creation
- Check that you're using Stripe Checkout (not Payment Intents directly)

### Discount not applying
- Verify the coupon applies to the correct price/product
- Check coupon duration and expiration
- Verify the promo code is active (not expired or maxed out)

### Code not working
- Check if code is case-sensitive
- Verify code hasn't reached usage limit
- Check if code is expired
- Ensure you're in the correct Stripe mode (test vs live)

---

**Last Updated:** February 2025

