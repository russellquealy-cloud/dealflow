# Quick Setup Checklist

## ✅ What You've Completed

- [x] Ran `add_saved_searches.sql` 
- [x] Ran `fix_listings_owner_id.sql`
- [x] Added Stripe keys to Vercel
- [x] Updated `.env.local` with Stripe secret key
- [x] Configured Stripe webhook events

## 🔧 Final Steps Needed

### 1. Email Configuration ✅ (One SMTP is fine!)

**In `.env.local`, add:**
```bash
EMAIL_SERVICE=smtp
SMTP_HOST=mail.privateemail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=customerservice@offaxisdeals.com
SMTP_PASS=your-actual-password-here

SMTP_FROM="Off Axis Deals Support <customerservice@offaxisdeals.com>"
SMTP_REPLY_TO=customerservice@offaxisdeals.com

SUPPORT_EMAIL=customerservice@offaxisdeals.com
SALES_EMAIL=sales@offaxisdeals.com
NOREPLY_EMAIL=noreply@offaxisdeals.com
```

**Note**: One SMTP config is sufficient! The code automatically uses the right "from" address based on context.

### 2. Fix Stripe Webhook Event ⚠️

**In Stripe Dashboard → Webhooks:**
- ❌ **Deselect**: `invoice.paid`
- ✅ **Select**: `invoice.payment_succeeded` (this is what our code uses)

### 3. Get Stripe Price IDs 📋

**For each of your 8 products, get the Price ID:**

1. Go to **Stripe Dashboard → Products**
2. Click on each product
3. Find the **Price ID** (looks like `price_1AbCdEf...`)
4. Add to **Vercel Environment Variables** (Production):
   ```
   STRIPE_PRICE_INVESTOR_BASIC=price_xxxxx
   STRIPE_PRICE_INVESTOR_BASIC_YEARLY=price_xxxxx
   STRIPE_PRICE_INVESTOR_PRO=price_xxxxx
   STRIPE_PRICE_INVESTOR_PRO_YEARLY=price_xxxxx
   STRIPE_PRICE_WHOLESALER_BASIC=price_xxxxx
   STRIPE_PRICE_WHOLESALER_BASIC_YEARLY=price_xxxxx
   STRIPE_PRICE_WHOLESALER_PRO=price_xxxxx
   STRIPE_PRICE_WHOLESALER_PRO_YEARLY=price_xxxxx
   ```

5. **Also add to `.env.local`** for local development (use test mode price IDs)

### 4. Run Database Verification Script

**In Supabase SQL Editor, run:**
- `supabase/sql/verify_watchlists_alerts.sql`

This will create/verify the `watchlists` and `alerts` tables.

### 5. Get Stripe Webhook Secret

**In Stripe Dashboard:**
1. Go to **Developers → Webhooks**
2. Click on your webhook endpoint
3. Copy the **"Signing secret"** (starts with `whsec_`)
4. Add to **Vercel**: `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`
5. Add to **`.env.local`**: `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`

## 🎯 Priority Order

1. **Email setup** (15 min) - Test sending emails
2. **Stripe Price IDs** (10 min) - Get all 8 IDs and add to Vercel
3. **Stripe Webhook** (5 min) - Fix event selection and add secret
4. **Database tables** (2 min) - Run verification script

## 📝 Quick Reference

**Your Products:**
- Investor Basic: $29/month, $290/year
- Investor Pro: $59/month, $590/year  
- Wholesaler Basic: $25/month, $250/year
- Wholesaler Pro: $59/month, $590/year

**Total: 8 Price IDs needed** (4 products × 2 billing periods)

## ✅ Verification

After completing above:
- [ ] Test feedback form sends email
- [ ] Test contact sales form sends email
- [ ] Try upgrading an account (test mode)
- [ ] Check webhook events are received
- [ ] Verify price IDs work in checkout

See `STRIPE_FINAL_SETUP.md` and `EMAIL_CONFIGURATION_FINAL.md` for detailed guides!

