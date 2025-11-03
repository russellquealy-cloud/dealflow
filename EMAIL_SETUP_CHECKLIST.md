# Email Setup Checklist - Namecheap Private Email

## Files Changed

✅ **Created/Updated:**
- `/app/lib/email.ts` - New SMTP-only implementation
- `/app/api/test-email/route.ts` - Test endpoint
- `/app/api/email-diag/route.ts` - Diagnostics endpoint  
- `/app/api/feedback/route.ts` - Updated to use new email system

## 1. Verify Dependencies

Run this in your project root:
```bash
npm i nodemailer
```

Or if using pnpm:
```bash
pnpm add nodemailer
```

Verify it's installed:
```bash
npm list nodemailer
```

## 2. Vercel Environment Variables

### Required Variables (Add to Production + Preview)

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add ALL of these:

```env
# SMTP Configuration
SMTP_HOST=mail.privateemail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=no_reply@offaxisdeals.com
SMTP_PASS=REPLACE_WITH_NO_REPLY_PASSWORD
SMTP_FROM=Off Axis Deals <no_reply@offaxisdeals.com>
SMTP_REPLY_TO=customerservice@offaxisdeals.com

# App Email Addresses
SUPPORT_EMAIL=customerservice@offaxisdeals.com
SALES_EMAIL=sales@offaxisdeals.com
NOREPLY_EMAIL=no_reply@offaxisdeals.com
```

### Important Notes:
- ⚠️ `SMTP_FROM` email address **MUST match** `SMTP_USER` for Namecheap
- `SMTP_SECURE=false` because port 587 uses STARTTLS (not SSL)
- Replace `SMTP_PASS` with your actual Namecheap Private Email password

## 3. Vercel Actions After Adding Variables

1. **Redeploy Project**
   - Go to **Deployments**
   - Click **"Redeploy"** on latest deployment OR push a new commit
   - This ensures serverless functions load the new environment variables

2. **Test Email Diagnostics**
   ```bash
   curl -sS https://offaxisdeals.com/api/email-diag | jq
   ```
   Expected: `{"ok": true, "env": {...}}`

3. **Test Email Sending**
   ```bash
   curl -sS -X POST https://offaxisdeals.com/api/test-email | jq
   ```
   Expected: `{"ok": true, "result": {...}}`

4. **Monitor Function Logs**
   - Go to **Vercel Dashboard → Your Project → Functions → Logs**
   - Watch for `/api/email-diag` and `/api/test-email` logs
   - Check for SMTP connection errors

## 4. Supabase SMTP Configuration (for Magic Links)

Go to **Supabase Dashboard → Authentication → Settings → SMTP Settings**

Configure:

- **Host**: `mail.privateemail.com`
- **Port**: `587`
- **Username**: `no_reply@offaxisdeals.com`
- **Password**: [Your Namecheap Private Email password]
- **Sender name**: `Off Axis Deals`
- **Sender email**: `no_reply@offaxisdeals.com`

**Test**: Send a test magic link to yourself from Supabase Auth settings.

## 5. Namecheap DNS Checklist

Verify these DNS records exist in your Namecheap domain settings:

### MX Records
- **Host**: `@` (or blank)
- **Value**: `mx1.privateemail.com` (Priority 10)
- **Value**: `mx2.privateemail.com` (Priority 20)

### SPF Record (TXT)
- **Host**: `@` (or blank)  
- **Value**: `v=spf1 include:spf.privateemail.com ~all`

### DKIM Record
- Check **Namecheap Private Email Panel** for DKIM settings
- Should be automatically configured
- Look for TXT record on `_dmarc` subdomain or similar

### DMARC Record (TXT)
- **Host**: `_dmarc`
- **Value**: `v=DMARC1; p=quarantine; pct=100; adkim=s; aspf=s`

## 6. Testing Checklist

After deployment:

- [ ] Run email diagnostics: `curl https://offaxisdeals.com/api/email-diag`
- [ ] Run test email: `curl -X POST https://offaxisdeals.com/api/test-email`
- [ ] Check email inbox for test message
- [ ] Test feedback form submission
- [ ] Test contact sales form
- [ ] Test magic link from Supabase (should arrive via SMTP)
- [ ] Check Vercel function logs for any errors

## 7. Troubleshooting

### "SMTP_FROM must equal SMTP_USER" Error
- ✅ Fix: Ensure `SMTP_FROM` email address matches `SMTP_USER`
- Example: Both should be `no_reply@offaxisdeals.com`

### "Connection timeout" Error
- Check `SMTP_HOST` is correct: `mail.privateemail.com`
- Check `SMTP_PORT` is `587` (not 465)
- Check `SMTP_SECURE=false` (not true)

### "Authentication failed" Error
- Verify `SMTP_USER` and `SMTP_PASS` are correct
- Check password in Namecheap Private Email panel
- Ensure no extra spaces in env vars

### Emails not arriving
- Check spam folder
- Verify DNS records (MX, SPF, DKIM, DMARC)
- Check Namecheap Private Email logs
- Verify recipient email address is correct

## 8. Remove Debug Endpoints (After Testing)

Once everything works:

1. Delete `/app/api/email-diag/route.ts` (or comment it out)
2. In `/app/lib/email.ts`, set:
   ```typescript
   logger: false,  // Change from process.env.NODE_ENV !== "production"
   debug: false,   // Change from process.env.NODE_ENV !== "production"
   ```

## 9. Production Email Addresses

Ensure these email boxes exist in Namecheap Private Email:

- ✅ `no_reply@offaxisdeals.com` - For automated emails
- ✅ `customerservice@offaxisdeals.com` - For support emails
- ✅ `sales@offaxisdeals.com` - For sales inquiries

---

**Ready to test?** Run the curl commands above after deploying with new env vars!

