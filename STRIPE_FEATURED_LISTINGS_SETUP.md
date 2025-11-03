# Stripe Setup: Featured Listings, Promo Codes & Free Trials

## 1. Featured Listing Product Setup

### Create Featured Listing Product in Stripe Dashboard

1. Go to **Stripe Dashboard → Products**
2. Click **"+ Add product"**
3. Set up product:
   - **Name**: "Featured Listing"
   - **Description**: "Feature your listing for 1 week - increased visibility"
   - **Pricing**: 
     - **Price**: $5.00
     - **Billing period**: One time (not recurring)
   - **Tax**: Configure as needed

4. **Save Product**
5. **Copy the Price ID** (starts with `price_...`) - you'll need this

### Add Price ID to Environment Variables

Add to Vercel environment variables:

```
STRIPE_FEATURED_LISTING_PRICE_ID=price_xxxxxxxxxxxxx
```

### Update Code to Use Featured Listing Price

The featured listing checkout flow should use this price ID when users click "Make Featured".

## 2. Promo Codes Setup

### Create Promo Code in Stripe Dashboard

1. Go to **Stripe Dashboard → Products → Coupons**
2. Click **"+ Create coupon"**
3. Configure coupon:
   - **Name**: e.g., "WELCOME2024"
   - **Discount type**: 
     - **Percentage off** (e.g., 25%)
     - **Amount off** (e.g., $10)
   - **Duration**: 
     - **Once**: Single use
     - **Forever**: Recurring discount
     - **Repeating**: For X months
   - **Redemption limits**: Optional (max uses)
   - **Expiration**: Optional

4. **Save Coupon**

5. **Create Promo Code** from the coupon:
   - Click on the coupon you created
   - Click **"Create promo code"**
   - **Code**: e.g., "WELCOME2024" (what users enter)
   - **Max redemptions**: Optional
   - **Expiration**: Optional

6. **Copy the Promo Code ID** (starts with `promo_...`) if you need it

### Apply Promo Code in Checkout

Users can enter promo codes during Stripe Checkout. The code will be validated automatically by Stripe.

To pre-apply a promo code programmatically, pass it to the checkout session:

```typescript
// In app/api/billing/create-checkout-session/route.ts
const session = await stripe.checkout.sessions.create({
  // ... other params
  discounts: [{
    coupon: 'WELCOME2024' // The promo code string, not ID
  }]
});
```

## 3. Free Trials Setup

### For Subscriptions (Monthly/Yearly Plans)

1. Go to **Stripe Dashboard → Products**
2. Select your subscription product (e.g., "Investor Basic Monthly")
3. Edit the **Recurring price**
4. Under **Trial period**, set:
   - **Trial length**: e.g., 7 days, 14 days, 30 days
   - **Trial period type**: "Day"

5. **Save**

### For Featured Listings (One-Time)

Free trials for one-time purchases require custom logic:

1. Create a **subscription with trial** that converts to one-time payment
2. OR use a **promo code** that gives 100% off for first purchase
3. OR implement trial logic in your application (track trial status in database)

## 4. Implementation Checklist

### Code Changes Needed

- [ ] Add `STRIPE_FEATURED_LISTING_PRICE_ID` to Vercel env vars
- [ ] Update "Make Featured" button to create Stripe checkout session with featured listing price
- [ ] Add promo code input field to pricing page (optional - Stripe Checkout has built-in field)
- [ ] Handle promo code in checkout success webhook
- [ ] Update subscription products in Stripe to have trial periods if desired

### Testing

1. **Test Featured Listing Checkout**:
   ```
   - Click "Make Featured" on a listing
   - Complete checkout with test card: 4242 4242 4242 4242
   - Verify webhook updates listing.featured = true
   ```

2. **Test Promo Codes**:
   ```
   - Start checkout
   - Enter promo code in Stripe checkout page
   - Verify discount applies
   - Complete purchase and verify webhook
   ```

3. **Test Free Trials**:
   ```
   - Sign up for subscription with trial
   - Verify no charge on card
   - Verify subscription status = "trialing"
   - Wait for trial period
   - Verify webhook fires when trial converts to active
   ```

## 5. Webhook Handling

Update `/app/api/billing/webhook/route.ts` to handle:

- `checkout.session.completed` - Featured listing purchase
- `customer.subscription.created` - New subscription (with trial status)
- `customer.subscription.trial_will_end` - Trial ending soon
- `customer.subscription.updated` - Trial converted to active

## 6. Environment Variables Summary

Add to Vercel:

```
# Featured Listings
STRIPE_FEATURED_LISTING_PRICE_ID=price_xxxxxxxxxxxxx

# Existing Stripe vars (keep these)
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
# ... etc
```

## 7. Promo Code Examples

Common promo codes you might create:

- `WELCOME10` - 10% off first month
- `SAVE50` - $50 off annual subscription  
- `TRIAL7` - 7-day free trial (for subscriptions)
- `FIRSTFEATURED` - Free featured listing (100% off)
- `LAUNCH25` - 25% off for launch period

## 8. Free Trial Best Practices

- **Track trial status** in database (`profiles` or `subscriptions` table)
- **Send reminder emails** 3 days before trial ends
- **Handle trial expiration** in webhook when status changes from "trialing" to "active"
- **Grace period**: Consider 24-hour grace period after trial ends before disabling access

---

**Note**: All promo codes and free trials are managed in Stripe Dashboard. No code changes needed for basic promo codes - Stripe Checkout UI handles them automatically.

