# Supabase Email Configuration Guide

This document outlines the required Supabase dashboard configuration for authentication email delivery (magic link and password reset).

## Required Configuration Steps

### 1. Supabase Auth URL Allowlist

**Location:** Supabase Dashboard → Authentication → URL Configuration

**Required URLs to whitelist:**

#### Development:
- `http://localhost:3000/login`
- `http://localhost:3000/reset-password`

#### Production:
- `https://offaxisdeals.com/login`
- `https://offaxisdeals.com/reset-password`

**How to add:**
1. Go to Supabase Dashboard
2. Navigate to Authentication → URL Configuration
3. Add each URL above to the "Redirect URLs" list
4. Save changes

---

### 2. Email Templates Configuration

**Location:** Supabase Dashboard → Authentication → Email Templates

#### Magic Link Template

**Template Variables:**
- `{{ .Email }}` - User's email address
- `{{ .TokenHash }}` - Authentication token (automatically handled)
- `{{ .ConfirmationURL }}` - Full confirmation URL (includes token)
- `{{ .RedirectTo }}` - Redirect URL after confirmation

**Required Redirect URL:**
The template must redirect to:
```
${NEXT_PUBLIC_SITE_URL}/login
```

**Example Template:**
```html
<h2>Sign in to Off Axis Deals</h2>
<p>Click the link below to sign in:</p>
<p><a href="{{ .ConfirmationURL }}">Sign In</a></p>
<p>Or copy and paste this URL into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p>This link will expire in 1 hour.</p>
```

#### Password Reset Template

**Template Variables:**
- `{{ .Email }}` - User's email address
- `{{ .TokenHash }}` - Reset token (automatically handled)
- `{{ .RedirectTo }}` - Redirect URL after password reset

**Required Redirect URL:**
The template must redirect to:
```
${NEXT_PUBLIC_SITE_URL}/reset-password
```

**Example Template:**
```html
<h2>Reset Your Password</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .RedirectTo }}?token={{ .TokenHash }}">Reset Password</a></p>
<p>Or copy and paste this URL into your browser:</p>
<p>{{ .RedirectTo }}?token={{ .TokenHash }}</p>
<p>This link will expire in 1 hour, giving you plenty of time to check your email and reset your password.</p>
```

**Password Reset Token Expiration:**
- **Default:** 1 hour (3600 seconds)
- **Minimum Recommended:** 5 minutes (300 seconds) - gives users time to check email and click link
- **Location to Configure:** Supabase Dashboard → Authentication → Settings → Password Reset
- **How to Change:**
  1. Go to Supabase Dashboard
  2. Navigate to Authentication → Settings
  3. Scroll to "Password Reset" section
  4. Adjust "Token Expiry" (in seconds)
  5. Recommended: Keep at 1 hour (3600) or minimum 5 minutes (300)
  6. Click "Save"

---

### 3. SMTP Configuration

**Location:** Supabase Dashboard → Project Settings → Auth → SMTP Settings

**Required Settings:**
- **SMTP Host:** (Namecheap Private Email SMTP server)
- **SMTP Port:** 587 (TLS) or 465 (SSL)
- **SMTP User:** Your email address
- **SMTP Password:** Your email password
- **Sender Email:** Your verified sender email
- **Sender Name:** Off Axis Deals LLC

**Namecheap Private Email SMTP Details:**
- Host: `mail.privateemail.com` (or your domain's mail server)
- Port: 587 (recommended) or 465
- Security: TLS (for port 587) or SSL (for port 465)

---

### 4. Email Domain Authentication (SPF, DKIM, DMARC)

**Important:** For production email delivery, configure DNS records:

#### SPF Record
```
v=spf1 include:_spf.google.com ~all
```
(Or your email provider's SPF record)

#### DKIM Record
Add DKIM public key provided by your email provider to DNS.

#### DMARC Record
```
v=DMARC1; p=quarantine; rua=mailto:admin@offaxisdeals.com
```

**How to verify:**
1. Check DNS records using tools like `dig` or online DNS checkers
2. Verify in Supabase dashboard that emails are being sent
3. Check email delivery logs in Supabase

---

### 5. Testing Email Delivery

#### Using Admin Dashboard
1. Log in as admin user
2. Navigate to `/admin`
3. Click "📧 Send Test Email to Myself" button
4. Check your inbox for test emails (magic link and password reset)

#### Using API Endpoint
```bash
POST /api/diagnostics/email
Content-Type: application/json

{
  "email": "your-email@example.com"
}
```

**Expected Response:**
```json
{
  "success": true,
  "testEmail": "your-email@example.com",
  "siteUrl": "https://offaxisdeals.com",
  "redirects": {
    "login": "https://offaxisdeals.com/login",
    "resetPassword": "https://offaxisdeals.com/reset-password"
  },
  "results": {
    "magicLink": { "success": true },
    "passwordReset": { "success": true }
  }
}
```

---

### 6. Environment Variables

**Required in Vercel:**
- `NEXT_PUBLIC_SITE_URL` - Base URL for redirects
  - Development: `http://localhost:3000`
  - Production: `https://offaxisdeals.com`

**Verify in Vercel Dashboard:**
1. Go to Project Settings → Environment Variables
2. Ensure `NEXT_PUBLIC_SITE_URL` is set correctly for each environment
3. Redeploy if changes are made

---

### 7. Troubleshooting

#### Emails Not Sending

1. **Check SMTP Configuration:**
   - Verify SMTP credentials are correct
   - Test SMTP connection in Supabase dashboard
   - Check for rate limits

2. **Check URL Allowlist:**
   - Ensure all redirect URLs are whitelisted
   - URLs must match exactly (including protocol and port)

3. **Check Email Templates:**
   - Verify template variables are correct
   - Ensure redirect URLs in templates match allowlist

4. **Check Logs:**
   - Review Supabase logs for email delivery errors
   - Check browser console for client-side errors
   - Review Vercel function logs

5. **Test with Diagnostics Endpoint:**
   - Use `/api/diagnostics/email` to test both email types
   - Review error messages in response

#### Common Errors

**Error: "Redirect URL not allowed"**
- Solution: Add the redirect URL to Supabase allowlist

**Error: "SMTP connection failed"**
- Solution: Verify SMTP credentials and server settings

**Error: "Rate limit exceeded"**
- Solution: Wait a few minutes and try again, or check Supabase rate limits

**Error: "Email template not found"**
- Solution: Verify email templates are configured in Supabase dashboard

---

### 8. Verification Checklist

Before going live, verify:

- [ ] All redirect URLs are whitelisted in Supabase
- [ ] Email templates use correct variables (`{{ .Email }}`, `{{ .TokenHash }}`, etc.)
- [ ] Email templates redirect to correct URLs (`/login` and `/reset-password`)
- [ ] SMTP configuration is correct and tested
- [ ] `NEXT_PUBLIC_SITE_URL` is set in Vercel for all environments
- [ ] Test emails are received successfully
- [ ] Magic link flow works end-to-end
- [ ] Password reset flow works end-to-end
- [ ] SPF/DKIM/DMARC records are configured (for production)

---

**Last Updated:** January 2025  
**Maintained By:** Development Team

