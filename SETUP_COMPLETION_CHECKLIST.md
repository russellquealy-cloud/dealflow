# Setup Completion Checklist

## ✅ What You've Completed

1. ✅ **Saved Searches Table**: Ran `add_saved_searches.sql` successfully
2. ✅ **Listings Owner ID**: Ran `fix_listings_owner_id.sql` successfully  
3. ✅ **Stripe Yearly Prices**: Added to `.env.local`

## 📋 What You Need to Complete

### 1. Verify/Create Watchlists and Alerts Tables

**Run this SQL script in Supabase:**
- File: `supabase/sql/verify_watchlists_alerts.sql`
- This will create the `watchlists` and `alerts` tables if they don't exist
- It also sets up the proper RLS policies and indexes

**Note**: You have multiple watchlist-related tables (`user_watchlists`, `watchlist_items`, `watchlists`). The code uses the simple `watchlists` table structure. You can ignore the others or remove them if they're not needed.

### 2. Configure Email Service in `.env.local`

Add these lines to your `.env.local` file:

```bash
# Email Service Type
EMAIL_SERVICE=smtp

# SMTP Configuration
SMTP_HOST=mail.privateemail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=customerservice@offaxisdeals.com
SMTP_PASS=your-actual-mailbox-password-here

# Email Identities
SMTP_FROM="Off Axis Deals Support <customerservice@offaxisdeals.com>"
SMTP_REPLY_TO=customerservice@offaxisdeals.com

# Application Email Addresses
SUPPORT_EMAIL=customerservice@offaxisdeals.com
SALES_EMAIL=sales@offaxisdeals.com
NOREPLY_EMAIL=noreply@offaxisdeals.com
```

**Important**: Replace `your-actual-mailbox-password-here` with the actual password for the `customerservice@offaxisdeals.com` mailbox.

### 3. Test Email Setup

1. **Test in Console Mode First** (to verify code works):
   ```bash
   EMAIL_SERVICE=console
   ```
   Then submit a feedback form - you should see the email logged in your terminal.

2. **Test with SMTP** (to verify email delivery):
   ```bash
   EMAIL_SERVICE=smtp
   ```
   Then submit a feedback form - check your `customerservice@offaxisdeals.com` inbox.

### 4. Production Stripe Setup

For production Stripe account setup in Supabase:

1. **Get Production Stripe Keys**:
   - Go to Stripe Dashboard → Developers → API Keys
   - Copy the **Live mode** secret key and publishable key

2. **Add to Supabase Environment Variables**:
   - Go to Supabase Dashboard → Project Settings → Environment Variables
   - Add:
     - `STRIPE_SECRET_KEY` = your live secret key
     - `STRIPE_PUBLISHABLE_KEY` = your live publishable key
     - `STRIPE_WEBHOOK_SECRET` = your webhook signing secret (from Webhooks section)

3. **Configure Webhook in Stripe**:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://your-domain.com/api/billing/webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

4. **Add Production Price IDs**:
   - In Stripe Dashboard → Products
   - For each product, copy the **Live mode** price IDs
   - Add to Supabase environment variables:
     - `STRIPE_PRICE_INVESTOR_BASIC`
     - `STRIPE_PRICE_INVESTOR_BASIC_YEARLY`
     - `STRIPE_PRICE_INVESTOR_PRO`
     - `STRIPE_PRICE_INVESTOR_PRO_YEARLY`
     - `STRIPE_PRICE_WHOLESALER_BASIC`
     - `STRIPE_PRICE_WHOLESALER_BASIC_YEARLY`
     - `STRIPE_PRICE_WHOLESALER_PRO`
     - `STRIPE_PRICE_WHOLESALER_PRO_YEARLY`

## 🔍 Verification Steps

### Verify Tables Exist
Run this query in Supabase SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('watchlists', 'alerts', 'saved_searches');
```

You should see all three tables listed.

### Verify Email Configuration
1. Check `.env.local` has all SMTP variables set
2. Test by submitting feedback form
3. Check email inbox for delivery

### Verify Stripe Configuration
1. Check environment variables are set
2. Try upgrading a test account
3. Verify webhook events in Stripe Dashboard

## 📝 Notes

- **Watchlists**: The code uses the simple `watchlists` table. If you want to use `user_watchlists` instead, we'd need to update the API routes.
- **Email**: All emails are sent via SMTP using your PrivateEmail account. Make sure the mailbox password is correct.
- **Stripe**: Production keys are different from test keys. Make sure you're using the right ones.

## 🆘 Troubleshooting

See `EMAIL_SETUP_GUIDE.md` for detailed email troubleshooting.

For Stripe issues, check:
- Webhook URL is correct
- Webhook secret matches
- Price IDs are from Live mode
- Subscription webhooks are enabled

