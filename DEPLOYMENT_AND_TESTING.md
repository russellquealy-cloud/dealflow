# Deployment & Testing Guide

## ✅ Setup Complete!

You've successfully configured:
- ✅ All 8 Stripe price IDs in Vercel
- ✅ Webhook endpoint configured to production domain
- ✅ Email service (SMTP) configured
- ✅ Database tables created
- ✅ All environment variables set

**Stripe CLI isn't needed** - you'll test with real checkout transactions instead!

## 🚀 Deployment Checklist

Before deploying to production, verify:

### 1. Vercel Environment Variables
- [ ] All 8 Stripe price IDs are set for **Production** environment
- [ ] `STRIPE_SECRET_KEY` is set (production key, not test)
- [ ] `STRIPE_WEBHOOK_SECRET` is set
- [ ] `EMAIL_SERVICE=smtp` is set
- [ ] All SMTP variables are set
- [ ] `SUPPORT_EMAIL`, `SALES_EMAIL`, `NOREPLY_EMAIL` are set

### 2. Supabase Production
- [ ] Production Supabase project is set up
- [ ] All SQL scripts have been run:
  - `add_saved_searches.sql` ✅
  - `fix_listings_owner_id.sql` ✅
  - `verify_watchlists_alerts.sql` (run this if not done)
- [ ] RLS policies are active
- [ ] Production database has proper data

### 3. Domain & URLs
- [ ] Production domain is configured in Vercel
- [ ] Webhook URL in Stripe matches production domain
- [ ] `NEXT_PUBLIC_APP_URL` is set to production domain

## 🧪 Testing After Deployment

### Test 1: Stripe Checkout Flow

1. **Go to your live site**
2. **Sign up or log in** with a test account
3. **Go to Pricing page**
4. **Click "Upgrade to Basic"** (or Pro)
5. **In Stripe Checkout**, use test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits
6. **Complete checkout**

**What to Check:**
- ✅ Checkout completes successfully
- ✅ User is redirected back to your site
- ✅ In **Stripe Dashboard → Webhooks → Events**, you see:
  - `checkout.session.completed` event
  - Status: "Succeeded" (green)
- ✅ In **Supabase → profiles table**, user's `tier` and `segment` are updated

### Test 2: Email Functionality

**Test Feedback Form:**
1. Submit a feedback/bug report
2. Check `customerservice@offaxisdeals.com` inbox
3. Verify email arrives with correct format

**Test Contact Sales:**
1. Fill out contact sales form
2. Check `sales@offaxisdeals.com` inbox
3. Verify inquiry is received

### Test 3: Watchlists & Saved Searches

1. **Test Watchlist:**
   - Browse listings
   - Click ⭐ Save on a listing
   - Go to `/watchlists` page
   - Verify listing appears

2. **Test Saved Searches:**
   - Apply filters on listings page
   - Go to `/saved-searches`
   - Save current search
   - Verify it's saved

### Test 4: Messaging

1. **Test Message Flow:**
   - As investor, view a listing
   - Click "Message Seller"
   - Send a test message
   - Verify message is saved
   - Check messages page shows conversation

## 📊 Monitoring

### Stripe Dashboard
- **Webhooks → Your endpoint → Events**: Monitor all webhook deliveries
- Look for:
  - ✅ Green = Success
  - ❌ Red = Failure (click to see error)

### Vercel Dashboard
- **Deployments → Latest → Functions**:
  - Check `/api/billing/webhook` logs
  - Look for errors or warnings

### Supabase Dashboard
- **Table Editor → profiles**:
  - Verify users have correct `tier` and `segment` after upgrade
  - Check `active_price_id` matches Stripe price ID

## 🐛 Common Issues & Fixes

### Webhook Not Firing

**Symptoms:**
- Checkout completes, but database doesn't update
- No events in Stripe webhook logs

**Fix:**
1. Check webhook URL is correct in Stripe
2. Verify `STRIPE_WEBHOOK_SECRET` matches in Vercel
3. Check Vercel function logs for errors
4. Verify webhook is enabled (not disabled)

### Wrong Plan Assigned

**Symptoms:**
- User upgrades to Pro, but shows as Basic

**Fix:**
1. Check price IDs in Vercel match Stripe exactly
2. Verify `getPlanFromPriceId` function in `lib/stripe.ts`
3. Check webhook handler logs in Vercel

### Email Not Sending

**Symptoms:**
- Feedback form submits, but no email arrives

**Fix:**
1. Check `EMAIL_SERVICE=smtp` is set
2. Verify SMTP credentials are correct
3. Check spam folder
4. Try `EMAIL_SERVICE=console` to see if code works
5. Verify email addresses exist in PrivateEmail

## ✅ Success Indicators

You'll know everything is working when:

1. **Checkout Flow**:
   - ✅ User can upgrade successfully
   - ✅ Webhook events show "Succeeded" in Stripe
   - ✅ User profile updates in database
   - ✅ Account page shows correct plan

2. **Email**:
   - ✅ Feedback emails arrive at customerservice@
   - ✅ Sales inquiries arrive at sales@
   - ✅ No errors in Vercel logs

3. **Features**:
   - ✅ Watchlists work
   - ✅ Saved searches work
   - ✅ Messaging works
   - ✅ Alerts can be created

## 📝 Post-Deployment Tasks

### Immediate (First Week)
- [ ] Monitor first 10 transactions
- [ ] Check webhook success rate (should be 100%)
- [ ] Test email delivery
- [ ] Verify all features work in production

### Short-term (First Month)
- [ ] Set up Stripe email alerts for failed payments
- [ ] Monitor webhook error rate
- [ ] Review user feedback
- [ ] Check analytics/usage patterns

### Long-term
- [ ] Set up automated backups
- [ ] Monitor subscription renewals
- [ ] Track feature usage
- [ ] Plan for scaling

## 🎉 You're Ready!

Once you:
1. Deploy to production
2. Test the checkout flow with `4242 4242 4242 4242`
3. Verify webhook succeeds
4. Check database updates

**You're live and ready for real users!** 🚀

---

## Quick Reference

**Test Card**: `4242 4242 4242 4242`  
**Webhook URL**: `https://offaxisdeals.com/api/billing/webhook`  
**Webhook Events**: 10 events (as shown in your Stripe dashboard)  
**Monitor**: Stripe Dashboard → Webhooks → Events

