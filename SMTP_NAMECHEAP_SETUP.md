# 📧 SMTP Email Setup - Namecheap

**Your Setup:** Email hosting through Namecheap (SMTP)

---

## 🔧 **Step 1: Get Your SMTP Credentials**

### **Option A: Namecheap Webmail**
1. Log in to your Namecheap account
2. Go to **Domain List** → Select your domain
3. Go to **Advanced DNS** tab
4. Note your mail server settings (usually `mail.yourdomain.com`)

### **Option B: Namecheap Email Hosting**
1. Go to Namecheap Dashboard
2. **Email** → **Email Hosting**
3. Find your domain
4. Click **Manage** → **Email Accounts**
5. Create or select an email account (e.g., `noreply@offaxisdeals.com`)

### **SMTP Settings (Typical for Namecheap):**
```
SMTP Server: mail.yourdomain.com
SMTP Port: 587 (TLS) or 465 (SSL)
Username: your-email@yourdomain.com
Password: your-email-password
Encryption: TLS or SSL
```

---

## ⚙️ **Step 2: Add to Vercel Environment Variables**

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. Add these variables:

```bash
# SMTP Configuration
SMTP_HOST=mail.offaxisdeals.com
SMTP_PORT=587
SMTP_SECURE=false  # true for SSL (port 465), false for TLS (port 587)
SMTP_USER=noreply@offaxisdeals.com
SMTP_PASS=your-email-password-here

# Email Identity
SMTP_FROM="Off Axis Deals <noreply@offaxisdeals.com>"
SMTP_REPLY_TO=customerservice@offaxisdeals.com

# Application Email Addresses
SUPPORT_EMAIL=customerservice@offaxisdeals.com
SALES_EMAIL=sales@offaxisdeals.com
NOREPLY_EMAIL=noreply@offaxisdeals.com
```

3. **Important:** For production, set these in **Production** environment
4. Click **Save**

---

## 🔍 **Step 3: Verify Your Email Code**

Your email code should already support SMTP! Check `app/lib/email.ts`:

```typescript
// Should support SMTP if configured
if (process.env.SMTP_HOST) {
  return await sendViaSMTP(...);
}
```

---

## 🧪 **Step 4: Test Email**

### **Test via API:**
```bash
curl -X POST https://your-domain.com/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "type": "bug",
    "subject": "Test Email",
    "message": "Testing SMTP setup"
  }'
```

### **Check:**
1. Email should arrive at `customerservice@offaxisdeals.com`
2. Check spam folder if not in inbox
3. Check Vercel logs for errors

---

## 🔧 **Step 5: Configure Email Templates**

Update email templates in `app/lib/email.ts` or `app/lib/notifications.ts`:

- **Welcome emails**
- **Password reset**
- **Transaction receipts**
- **Message notifications**
- **Alert notifications**

---

## ⚠️ **Troubleshooting**

### **Email Not Sending?**
1. **Check SMTP credentials** - Verify username/password
2. **Check port** - Try 587 (TLS) or 465 (SSL)
3. **Check firewall** - Ensure port is not blocked
4. **Check Vercel logs** - Look for SMTP errors
5. **Verify DNS** - Ensure MX records are correct

### **Authentication Failed?**
- Double-check username and password
- Try using full email as username
- Verify account is active in Namecheap

### **Connection Timeout?**
- Try different port (587 vs 465)
- Check if your IP is blocked
- Verify SMTP server address is correct

---

## 📋 **Namecheap-Specific Notes**

1. **Rate Limits:** Namecheap may have sending limits (e.g., 300 emails/hour)
   - If you exceed, consider upgrading or using Resend for high volume

2. **SPF/DKIM:** Configure SPF and DKIM records in Namecheap DNS for better deliverability
   - SPF record: `v=spf1 include:spf.mail.hostinger.com ~all`
   - DKIM: Check Namecheap email settings

3. **Email Accounts:** You may need to create:
   - `noreply@offaxisdeals.com` - For system emails
   - `customerservice@offaxisdeals.com` - For support
   - `sales@offaxisdeals.com` - For sales inquiries

---

## 🚀 **Production Recommendations**

For production, consider:
1. **Use Resend** (if sending > 300 emails/day) - Better deliverability
2. **Keep SMTP** for low-volume personal emails
3. **Monitor** email delivery rates
4. **Set up** SPF/DKIM for domain authentication

---

**Once configured, your email system should work automatically!** ✅

