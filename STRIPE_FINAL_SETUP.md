# Stripe Final Setup Guide

## ✅ What You've Done
- [x] Added Stripe API keys to Vercel
- [x] Updated `.env.local` with secret key
- [x] Configured webhook events

## 🔧 Stripe Webhook Events - Final Check

You currently have these events selected:
- ✅ `checkout.session.completed` ✓
- ✅ `customer.subscription.created` ✓ (good to have, though we don't handle it)
- ✅ `customer.subscription.updated` ✓
- ✅ `customer.subscription.deleted` ✓
- ⚠️ `invoice.paid` (we need `invoice.payment_succeeded` instead)
- ✅ `invoice.payment_failed` ✓

**Action Required**: 
1. **Deselect** `invoice.paid` 
2. **Select** `invoice.payment_succeeded` instead
   - This is the event our code specifically listens for

Optional but recommended:
- Keep `customer.subscription.created` (useful for future features)

## 📋 Getting Price IDs from Stripe

For each product in your catalog, you need to get the **Price ID** (starts with `price_`).

### Steps:

1. **Go to Stripe Dashboard → Products**

2. **For each product, click on it** to see its pricing details

3. **Copy the Price ID** (looks like `price_1AbCdEfGhIjKlMn...`)

4. **Add to Vercel Environment Variables**:

   Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

   Add these (for **Production** environment):
   ```
   STRIPE_PRICE_INVESTOR_BASIC=price_xxxxx (monthly)
   STRIPE_PRICE_INVESTOR_BASIC_YEARLY=price_xxxxx (yearly $290)
   STRIPE_PRICE_INVESTOR_PRO=price_xxxxx (monthly $59)
   STRIPE_PRICE_INVESTOR_PRO_YEARLY=price_xxxxx (yearly $590)
   STRIPE_PRICE_WHOLESALER_BASIC=price_xxxxx (monthly $25)
   STRIPE_PRICE_WHOLESALER_BASIC_YEARLY=price_xxxxx (yearly $250)
   STRIPE_PRICE_WHOLESALER_PRO=price_xxxxx (monthly $59)
   STRIPE_PRICE_WHOLESALER_PRO_YEARLY=price_xxxxx (yearly $590)
   ```

5. **Also add to `.env.local`** for local development:
   ```bash
   STRIPE_PRICE_INVESTOR_BASIC=price_xxxxx
   STRIPE_PRICE_INVESTOR_BASIC_YEARLY=price_xxxxx
   STRIPE_PRICE_INVESTOR_PRO=price_xxxxx
   STRIPE_PRICE_INVESTOR_PRO_YEARLY=price_xxxxx
   STRIPE_PRICE_WHOLESALER_BASIC=price_xxxxx
   STRIPE_PRICE_WHOLESALER_BASIC_YEARLY=price_xxxxx
   STRIPE_PRICE_WHOLESALER_PRO=price_xxxxx
   STRIPE_PRICE_WHOLESALER_PRO_YEARLY=price_xxxxx
   ```

## 🔗 Webhook Configuration

1. **Webhook URL in Stripe**:
   - Development: `http://localhost:3000/api/billing/webhook` (use Stripe CLI)
   - Production: `https://your-domain.com/api/billing/webhook`

2. **Get Webhook Secret**:
   - In Stripe Dashboard → Developers → Webhooks
   - Click on your webhook endpoint
   - Copy the "Signing secret" (starts with `whsec_`)
   - Add to Vercel as: `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`
   - Add to `.env.local` for local testing

## 📝 Quick Reference: Your Products

Based on your catalog:

| Product Name | Monthly Price | Yearly Price | Price ID Needed |
|--------------|---------------|--------------|-----------------|
| Investor Basic | $29.00/month | $290.00/year | Monthly & Yearly |
| Investor Pro | $59.00/month | $590.00/year | Monthly & Yearly |
| Wholesaler Basic | $25.00/month | $250.00/year | Monthly & Yearly |
| Wholesaler Pro | $59.00/month | $590.00/year | Monthly & Yearly |

**Total: 8 Price IDs** (4 products × 2 billing periods)

## ✅ Verification Steps

1. **Check Vercel Environment Variables**:
   - Verify all 8 price IDs are set
   - Verify `STRIPE_SECRET_KEY` is set (production key)
   - Verify `STRIPE_WEBHOOK_SECRET` is set

2. **Check `.env.local`**:
   - All 8 price IDs present
   - `STRIPE_SECRET_KEY` present (test key for local dev)

3. **Test Webhook**:
   - In Stripe Dashboard → Webhooks
   - Click "Send test webhook"
   - Select `checkout.session.completed`
   - Should receive 200 OK response

4. **Test Upgrade Flow**:
   - Try upgrading a test account
   - Check that webhook events are received
   - Verify subscription updates in your database

## 🆘 Troubleshooting

### Webhook not receiving events
- Check webhook URL is correct
- Verify `STRIPE_WEBHOOK_SECRET` matches the secret in Stripe
- Check Vercel logs for webhook errors

### Wrong plan assigned
- Verify price IDs match between Stripe and code
- Check `getPlanFromPriceId` function in `lib/stripe.ts`

### Prices not showing correctly
- Verify all 8 price IDs are in environment variables
- Check `.env.local` has test mode price IDs
- Check Vercel has production price IDs

