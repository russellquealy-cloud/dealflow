# Final Verification Checklist

## ✅ Configuration Complete

You've completed:
- [x] All 8 Stripe price IDs in Vercel
- [x] Webhook URL set to production domain
- [x] Environment variables set for all environments
- [x] Email configuration (one SMTP)
- [x] Database tables created

## 🎯 Final Verification Steps

### 1. Verify Stripe Price IDs in Vercel

**Check Vercel Dashboard:**
1. Go to **Project Settings → Environment Variables**
2. Verify you have all 8 variables:
   - `STRIPE_PRICE_INVESTOR_BASIC`
   - `STRIPE_PRICE_INVESTOR_BASIC_YEARLY`
   - `STRIPE_PRICE_INVESTOR_PRO`
   - `STRIPE_PRICE_INVESTOR_PRO_YEARLY`
   - `STRIPE_PRICE_WHOLESALER_BASIC`
   - `STRIPE_PRICE_WHOLESALER_BASIC_YEARLY`
   - `STRIPE_PRICE_WHOLESALER_PRO`
   - `STRIPE_PRICE_WHOLESALER_PRO_YEARLY`

3. Verify they're set for **Production, Preview, and Development** (or at least Production)

### 2. Verify Webhook Configuration

**In Stripe Dashboard:**
1. **Developers → Webhooks**
2. Click on your webhook endpoint
3. Verify:
   - [ ] URL is: `https://your-domain.com/api/billing/webhook`
   - [ ] Status is **Enabled**
   - [ ] Events selected:
     - `checkout.session.completed` ✓
     - `customer.subscription.updated` ✓
     - `customer.subscription.deleted` ✓
     - `invoice.payment_succeeded` ✓ (not `invoice.paid`)
     - `invoice.payment_failed` ✓

4. Copy the **Signing secret** (whsec_...)
5. Verify it's in Vercel as `STRIPE_WEBHOOK_SECRET`

### 3. Test Webhook Delivery (Optional)

Since you can't find "Send test webhook" in Stripe, try this:

**Method 1: Real Test Transaction**
1. Go to your live site's pricing page
2. Click "Upgrade" on any plan
3. Use Stripe test card: `4242 4242 4242 4242`
4. Complete checkout
5. Check Stripe Dashboard → Webhooks → Your endpoint → "Events" tab
6. You should see a `checkout.session.completed` event with status "Succeeded"

**Method 2: Check Recent Events**
- In Stripe Dashboard → Developers → Events
- You can see all recent events
- Click on any event → "Send to endpoint" → Select your webhook

### 4. Verify Email Configuration

**In `.env.local`:**
- [ ] `EMAIL_SERVICE=smtp`
- [ ] All SMTP variables set
- [ ] `SUPPORT_EMAIL`, `SALES_EMAIL`, `NOREPLY_EMAIL` set

**Test:**
1. Set `EMAIL_SERVICE=console` first
2. Submit feedback form - check console logs
3. Set `EMAIL_SERVICE=smtp`
4. Submit feedback form - check email inbox

### 5. Verify Database Tables

**In Supabase SQL Editor, run:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('watchlists', 'alerts', 'saved_searches');
```

Should return 3 rows.

## 🚀 You're Ready!

Everything is configured. Here's what to expect:

### When a User Upgrades:

1. **User clicks "Upgrade"** → Stripe Checkout opens
2. **User completes payment** → Stripe sends webhook
3. **Webhook updates database** → User's profile gets new tier
4. **User sees new plan** → Account page shows upgraded plan

### Monitoring:

- **Stripe Dashboard → Webhooks**: See all webhook deliveries
- **Vercel Dashboard → Functions**: See webhook handler logs
- **Supabase Dashboard → Table Editor**: See user profile updates

## 🐛 If Something Doesn't Work

1. **Check Vercel Function Logs**:
   - Project → Deployments → Latest → Functions → `/api/billing/webhook`
   - Look for errors

2. **Check Stripe Webhook Logs**:
   - Developers → Webhooks → Your endpoint → "Events"
   - Red events = failures

3. **Check Database**:
   - Verify user profiles are updating
   - Check `tier`, `segment`, `active_price_id` columns

4. **Common Issues**:
   - Price ID mismatch → Check Vercel env vars match Stripe
   - Webhook secret mismatch → Re-copy from Stripe
   - RLS policy blocking → Check Supabase policies

## ✅ Next Steps

You're all set! The system should work automatically. Consider:

1. **Monitor first few transactions** to ensure everything works
2. **Test with real test card** to verify end-to-end flow
3. **Set up alerts** in Stripe for failed webhooks
4. **Document** any custom configuration for your team

**Congratulations! Your setup is complete! 🎉**

