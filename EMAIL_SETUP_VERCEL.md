# Email Service Setup in Vercel

This guide will help you configure email delivery for Off Axis Deals using Vercel environment variables.

---

## Choose Your Email Service

We support three options:
1. **SMTP** (Gmail, SendGrid, Mailgun, etc.) - Most flexible
2. **Resend** - Modern, developer-friendly (Recommended)
3. **SendGrid** - Enterprise-grade

### Recommendation: Resend
- Easy setup
- Free tier: 3,000 emails/month
- Great developer experience
- Simple API

---

## Option 1: Resend (Recommended)

### Step 1: Create Resend Account
1. Go to https://resend.com
2. Sign up for free account
3. Verify your email

### Step 2: Create API Key
1. Go to **API Keys** in Resend dashboard
2. Click **Create API Key**
3. Name it: "Off Axis Deals Production"
4. Copy the API key (starts with `re_`)

### Step 3: Add to Vercel
1. Go to your Vercel project: https://vercel.com/dashboard
2. Click on your project → **Settings** → **Environment Variables**
3. Add these variables:

```
EMAIL_SERVICE = resend
RESEND_API_KEY = re_your_api_key_here
EMAIL_FROM = Off Axis Deals <noreply@yourdomain.com>
SALES_EMAIL = sales@yourdomain.com
SUPPORT_EMAIL = customerservice@yourdomain.com
NOREPLY_EMAIL = noreply@yourdomain.com
```

### Step 4: Verify Domain (Optional but Recommended)
1. In Resend dashboard, go to **Domains**
2. Add your domain (e.g., `offaxisdeals.com`)
3. Add DNS records as instructed
4. Wait for verification (usually < 5 minutes)

### Step 5: Test
1. Deploy to Vercel
2. Go to `/contact-sales` and submit a form
3. Check your email inbox
4. Check Resend dashboard → **Logs** for delivery status

---

## Option 2: SMTP (Gmail, SendGrid, Mailgun)

### Step 1: Choose SMTP Provider

#### Gmail (Quick Test Only)
- ⚠️ **Not recommended for production** (low limits)
- Good for testing only

#### SendGrid SMTP (Recommended)
1. Sign up at https://sendgrid.com
2. Free tier: 100 emails/day
3. Go to **Settings** → **API Keys** → **Mail Settings** → **SMTP Settings**
4. Create SMTP credentials

#### Mailgun (Recommended)
1. Sign up at https://mailgun.com
2. Free tier: 5,000 emails/month for 3 months
3. Go to **Sending** → **Domain Settings** → **SMTP credentials**

### Step 2: Add to Vercel
Add these environment variables:

```
EMAIL_SERVICE = smtp
SMTP_HOST = smtp.sendgrid.net (or your provider's host)
SMTP_PORT = 587
SMTP_SECURE = false (true for 465, false for 587)
SMTP_USER = apikey (or your SMTP username)
SMTP_PASS = your_smtp_password_or_api_key
SMTP_FROM = Off Axis Deals <noreply@yourdomain.com>
SMTP_REPLY_TO = support@yourdomain.com
SALES_EMAIL = sales@yourdomain.com
SUPPORT_EMAIL = customerservice@yourdomain.com
NOREPLY_EMAIL = noreply@yourdomain.com
```

### Common SMTP Providers:

#### SendGrid SMTP
```
SMTP_HOST = smtp.sendgrid.net
SMTP_PORT = 587
SMTP_USER = apikey
SMTP_PASS = SG.your_sendgrid_api_key_here
```

#### Mailgun SMTP
```
SMTP_HOST = smtp.mailgun.org
SMTP_PORT = 587
SMTP_USER = postmaster@yourdomain.mailgun.org
SMTP_PASS = your_mailgun_password
```

#### Gmail (Testing Only)
```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = your_email@gmail.com
SMTP_PASS = your_app_password (not regular password - need 2FA enabled)
```

---

## Option 3: SendGrid API

### Step 1: Create SendGrid Account
1. Sign up at https://sendgrid.com
2. Verify your email

### Step 2: Create API Key
1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name: "Off Axis Deals Production"
4. Permissions: **Full Access** (or Mail Send only)
5. Copy the API key (starts with `SG.`)

### Step 3: Add to Vercel
```
EMAIL_SERVICE = sendgrid
SENDGRID_API_KEY = SG.your_api_key_here
EMAIL_FROM = noreply@yourdomain.com
SALES_EMAIL = sales@yourdomain.com
SUPPORT_EMAIL = customerservice@yourdomain.com
NOREPLY_EMAIL = noreply@yourdomain.com
```

### Step 4: Verify Sender
1. Go to **Settings** → **Sender Authentication**
2. Verify Single Sender or Domain
3. Complete verification process

---

## Environment Variables Reference

### Required for All Services
```
EMAIL_SERVICE = resend | smtp | sendgrid
```

### Resend
```
RESEND_API_KEY = re_...
EMAIL_FROM = Off Axis Deals <noreply@yourdomain.com>
```

### SMTP
```
SMTP_HOST = smtp.example.com
SMTP_PORT = 587
SMTP_SECURE = false
SMTP_USER = your_username
SMTP_PASS = your_password
SMTP_FROM = Off Axis Deals <noreply@yourdomain.com>
SMTP_REPLY_TO = support@yourdomain.com
```

### SendGrid API
```
SENDGRID_API_KEY = SG....
EMAIL_FROM = noreply@yourdomain.com
```

### Common to All
```
SALES_EMAIL = sales@yourdomain.com
SUPPORT_EMAIL = customerservice@yourdomain.com
NOREPLY_EMAIL = noreply@yourdomain.com
```

---

## How to Add Variables in Vercel

1. **Go to Vercel Dashboard**
   - Navigate to: https://vercel.com/dashboard
   - Select your project: `dealflow` (or your project name)

2. **Access Environment Variables**
   - Click **Settings** (top navigation)
   - Click **Environment Variables** (left sidebar)

3. **Add Each Variable**
   - Click **Add New**
   - Enter **Key** (e.g., `EMAIL_SERVICE`)
   - Enter **Value** (e.g., `resend`)
   - Select **Environment(s)**:
     - ✅ Production
     - ✅ Preview
     - ✅ Development (if testing locally)
   - Click **Save**

4. **Important Notes:**
   - After adding/changing variables, you **MUST redeploy** for changes to take effect
   - Secret values (API keys, passwords) are automatically encrypted
   - Don't commit secrets to Git

---

## Testing Email Setup

### Method 1: Use Feedback Form
1. Deploy with email variables set
2. Go to `/feedback` (or footer link)
3. Submit bug report or feedback
4. Check your inbox
5. Check email service dashboard (Resend/SendGrid) for logs

### Method 2: Use Contact Sales Form
1. Go to `/contact-sales`
2. Fill out the form
3. Submit
4. Check `SALES_EMAIL` inbox
5. Verify sender is `SMTP_FROM` or configured sender

### Method 3: Test via API (Developer)
```bash
curl -X POST https://your-domain.com/api/contact-sales \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "message": "Testing email setup"
  }'
```

---

## Troubleshooting

### Emails Not Sending

1. **Check Environment Variables**
   - Verify all required vars are set
   - Check for typos in variable names
   - Ensure values don't have extra spaces

2. **Check Email Service Dashboard**
   - Resend: Go to **Logs** → Check for errors
   - SendGrid: Go to **Activity** → Check delivery status
   - SMTP: Check provider's logs

3. **Check Vercel Logs**
   - Go to Vercel → Your Project → **Logs**
   - Look for email-related errors
   - Check function logs for `/api/contact-sales` and `/api/feedback`

4. **Common Issues:**

   **Issue:** "SMTP authentication failed"
   - ✅ Check SMTP_USER and SMTP_PASS are correct
   - ✅ For Gmail: Use App Password, not regular password
   - ✅ For SendGrid: Use API key, not password

   **Issue:** "Email service not configured"
   - ✅ Verify `EMAIL_SERVICE` is set correctly
   - ✅ Redeploy after adding variables

   **Issue:** "Domain not verified"
   - ✅ Complete domain verification in email service
   - ✅ Wait a few minutes after adding DNS records

   **Issue:** "Rate limit exceeded"
   - ✅ Check free tier limits
   - ✅ Upgrade plan if needed

---

## Production Recommendations

1. **Use Verified Domain**
   - Set up SPF, DKIM, DMARC records
   - Improves deliverability
   - Prevents spam folder

2. **Monitor Email Delivery**
   - Check bounce rates
   - Monitor spam complaints
   - Review delivery logs regularly

3. **Rate Limiting**
   - Consider adding rate limits to email endpoints
   - Prevent abuse/spam

4. **Email Templates**
   - Current emails use basic HTML
   - Consider using a template library (React Email, MJML)

---

## Quick Start Checklist

- [ ] Choose email service (Resend recommended)
- [ ] Create account and API key
- [ ] Add all environment variables to Vercel
- [ ] Verify domain (if using custom domain)
- [ ] Redeploy application
- [ ] Test with feedback form
- [ ] Verify email received
- [ ] Check spam folder if not in inbox
- [ ] Test contact sales form
- [ ] Test message notifications (send a message)

---

## Support

- **Resend Docs:** https://resend.com/docs
- **SendGrid Docs:** https://docs.sendgrid.com
- **Mailgun Docs:** https://documentation.mailgun.com

For issues, check Vercel function logs and email service dashboard first.

