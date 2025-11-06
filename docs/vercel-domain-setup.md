# Vercel Domain Configuration Guide

## 🎯 Configure Your Custom Domain in Vercel

To ensure `offaxisdeals.com` is properly configured and shows in Vercel deployments:

### Step 1: Add Domain in Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **off-axis-deals** (or your project name)
3. Navigate to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter: `offaxisdeals.com`
6. Click **Add**

### Step 2: Configure DNS Records

Vercel will show you DNS records to add:

**Option A: If using Vercel's Nameservers (Recommended)**
- Update your domain's nameservers at your registrar to:
  - `ns1.vercel-dns.com`
  - `ns2.vercel-dns.com`

**Option B: If keeping current nameservers**
- Add an A record:
  - Type: `A`
  - Name: `@` (or blank)
  - Value: `76.76.21.21`
- Add a CNAME record for www:
  - Type: `CNAME`
  - Name: `www`
  - Value: `cname.vercel-dns.com`

### Step 3: Set Environment Variables in Vercel

1. In Vercel Dashboard, go to **Settings** → **Environment Variables**
2. For **Production** environment, add:
   ```
   NEXT_PUBLIC_APP_URL=https://offaxisdeals.com
   ```
3. Click **Save**

### Step 4: Verify Domain Configuration

1. Wait for DNS propagation (can take up to 48 hours, usually ~15 minutes)
2. Check domain status in Vercel Dashboard → Settings → Domains
3. Status should show: **Valid Configuration** ✅

### Step 5: Update Stripe Webhook (If Needed)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Webhooks
2. Update webhook endpoint URL to:
   ```
   https://offaxisdeals.com/api/stripe/webhook
   ```
3. Save changes

### Step 6: Redeploy

After setting environment variables:
1. Go to **Deployments** tab
2. Click **⋯** on the latest deployment
3. Click **Redeploy** (this ensures `NEXT_PUBLIC_APP_URL` is picked up)

---

## ✅ Verification Checklist

- [ ] Domain added in Vercel Dashboard → Settings → Domains
- [ ] DNS records configured correctly
- [ ] `NEXT_PUBLIC_APP_URL=https://offaxisdeals.com` set in Vercel Production environment
- [ ] Domain shows "Valid Configuration" in Vercel
- [ ] Site loads at `https://offaxisdeals.com`
- [ ] Stripe webhook URL updated to `https://offaxisdeals.com/api/stripe/webhook`
- [ ] Latest deployment completed after environment variable changes

---

## 🚨 Important Notes

1. **Environment Variables**: The `NEXT_PUBLIC_APP_URL` environment variable MUST be set in Vercel's Production environment for the domain to work correctly with Stripe, email links, and other integrations.

2. **Preview Deployments**: Preview deployments will still use `*.vercel.app` domains. This is expected behavior.

3. **VERCEL_URL**: This is automatically set by Vercel. Do NOT override it in environment variables.

4. **Domain Propagation**: DNS changes can take up to 48 hours, but usually complete within 15-30 minutes.

---

## 🆘 Troubleshooting

### Domain not showing in Vercel
- Check DNS records are correct
- Verify domain is added in Vercel Dashboard
- Wait for DNS propagation

### Site loads but Stripe/webhooks fail
- Verify `NEXT_PUBLIC_APP_URL` is set in Vercel Production environment
- Redeploy after setting environment variable
- Check Stripe webhook URL matches your domain

### Preview deployments still use vercel.app
- This is normal - preview deployments always use vercel.app domains
- Only production deployments use your custom domain

