# Stripe Webhook Testing Guide

## 🎯 Testing Stripe Webhooks

### Option 1: Test via Stripe Dashboard (Production Webhook)

**To send a test webhook in Stripe:**

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Click on your webhook endpoint (the one pointing to your production URL)
3. In the webhook details page, you should see:
   - **"Send test webhook"** button (usually at the top or in the "..." menu)
   - Or look for a **"Test"** or **"Send test"** option
4. Click it and select an event type (e.g., `checkout.session.completed`)
5. Stripe will send a test event to your webhook URL

**Note**: If you don't see a "Send test webhook" button, it might be because:
- The webhook needs at least one successful delivery first
- Some Stripe accounts have this feature in a different location
- You might need to use Stripe CLI instead (see Option 2)

### Option 2: Test via Stripe CLI (Recommended for Local Testing)

For local development, use Stripe CLI:

1. **Install Stripe CLI** (if not already installed):
   ```bash
   # Windows (via Scoop)
   scoop install stripe
   
   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe CLI**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/billing/webhook
   ```

4. **In another terminal, trigger test events**:
   ```bash
   # Test checkout completion
   stripe trigger checkout.session.completed
   
   # Test subscription update
   stripe trigger customer.subscription.updated
   
   # Test payment succeeded
   stripe trigger invoice.payment_succeeded
   ```

### Option 3: Manual Testing (Real Transactions)

1. **Create a test checkout**:
   - Go to your pricing page
   - Click "Upgrade" on a plan
   - Use Stripe test card: `4242 4242 4242 4242`
   - Complete the checkout
   - Webhook will fire automatically

2. **Check webhook delivery**:
   - Go to **Stripe Dashboard → Developers → Webhooks**
   - Click on your webhook
   - View the "Events" tab to see delivery logs
   - Green = success, Red = failed

## 🔍 Verifying Webhook Configuration

### Check Webhook URL
- Production: `https://your-domain.com/api/billing/webhook`
- Make sure this matches your actual domain

### Check Events Selected
Your webhook should listen for:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created` (optional)
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded` (⚠️ Make sure this is selected, not `invoice.paid`)
- ✅ `invoice.payment_failed`

### Check Webhook Secret
1. In Stripe Dashboard → Webhooks → Your endpoint
2. Click "Reveal" next to "Signing secret"
3. Copy the value (starts with `whsec_`)
4. Verify it matches `STRIPE_WEBHOOK_SECRET` in Vercel

## 📋 Testing Checklist

### Pre-Testing
- [ ] All 8 price IDs are in Vercel environment variables
- [ ] Webhook URL is set to production domain
- [ ] `STRIPE_WEBHOOK_SECRET` is in Vercel
- [ ] All required events are selected in Stripe

### Test Steps
1. [ ] **Test Checkout Flow**:
   - Go to pricing page
   - Click "Upgrade" on a plan
   - Use test card `4242 4242 4242 4242`
   - Complete checkout
   - Verify webhook received in Stripe dashboard

2. [ ] **Check Database**:
   - Go to Supabase → Table Editor → `profiles`
   - Find the test user
   - Verify `tier`, `segment`, and `active_price_id` are updated

3. [ ] **Test Subscription Update**:
   - In Stripe Dashboard → Customers
   - Find test customer
   - Change subscription plan
   - Verify webhook received and database updated

4. [ ] **Test Subscription Cancellation**:
   - Cancel a test subscription
   - Verify webhook received
   - Check database shows user downgraded to 'free'

## 🐛 Troubleshooting

### Webhook Not Receiving Events

**Check Vercel Logs**:
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on latest deployment → "Functions" tab
3. Look for `/api/billing/webhook` logs
4. Check for errors

**Common Issues**:
- ❌ **401 Unauthorized**: Webhook secret doesn't match
- ❌ **400 Bad Request**: Signature verification failed
- ❌ **500 Internal Error**: Check server logs for specific error

**Fix Webhook Secret Mismatch**:
1. In Stripe → Webhooks → Your endpoint
2. Click "Reveal" to get signing secret
3. Copy to Vercel → Environment Variables → `STRIPE_WEBHOOK_SECRET`
4. Redeploy if needed

### Webhook Events Not Appearing

- Check event is selected in webhook settings
- Make sure webhook endpoint is active (not disabled)
- Verify URL is correct and accessible
- Check Stripe webhook delivery logs for errors

### Database Not Updating

- Check webhook handler logs in Vercel
- Verify user ID is in customer metadata
- Check Supabase RLS policies allow updates
- Verify `profiles` table has `tier`, `segment`, `active_price_id` columns

## ✅ Success Indicators

You'll know it's working when:
- ✅ Webhook events show "Succeeded" in Stripe dashboard
- ✅ User's `tier` and `segment` update in `profiles` table
- ✅ `active_price_id` matches the Stripe price ID
- ✅ User sees correct plan on account page
- ✅ No errors in Vercel function logs

## 📞 Quick Reference

**Stripe Test Cards**:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires auth: `4000 0025 0000 3155`

**Webhook Endpoint**: `https://your-domain.com/api/billing/webhook`

**Required Events**:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

