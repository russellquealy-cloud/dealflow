# Email Configuration - Final Setup

## 📧 Single SMTP Configuration (Recommended)

You only need **ONE SMTP configuration**. Use `customerservice@offaxisdeals.com` for authentication, but you can send emails FROM different addresses.

### Why One Configuration Works:

1. **SMTP Authentication**: You authenticate as `customerservice@offaxisdeals.com`
2. **From Address**: Can be different (must be verified/allowed by your provider)
3. **Code Handles It**: The code automatically sets the correct "from" address based on context

### Your `.env.local` Configuration:

```bash
# Email Service
EMAIL_SERVICE=smtp

# SMTP Configuration (authenticate as customerservice)
SMTP_HOST=mail.privateemail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=customerservice@offaxisdeals.com
SMTP_PASS=your-mailbox-password

# Default "from" address (for support emails)
SMTP_FROM="Off Axis Deals Support <customerservice@offaxisdeals.com>"
SMTP_REPLY_TO=customerservice@offaxisdeals.com

# Application Email Addresses
SUPPORT_EMAIL=customerservice@offaxisdeals.com
SALES_EMAIL=sales@offaxisdeals.com
NOREPLY_EMAIL=noreply@offaxisdeals.com
```

## 📬 Email Routing by Context

The application automatically uses the right "from" address:

| Action | From Address | To Address |
|--------|--------------|------------|
| Feedback/Bug Reports | `customerservice@offaxisdeals.com` | `SUPPORT_EMAIL` |
| Contact Sales Form | `customerservice@offaxisdeals.com` | `SALES_EMAIL` |
| Message Notifications | `noreply@offaxisdeals.com` | Recipient's email |

## ✅ Verification Steps

### 1. Verify Email Addresses in Your Provider

Make sure all three addresses are set up:
- ✅ `customerservice@offaxisdeals.com` (active, used for SMTP auth)
- ✅ `sales@offaxisdeals.com` (must exist, can receive emails)
- ✅ `noreply@offaxisdeals.com` (must exist, primarily for sending)

### 2. Test Email Sending

**Step 1: Test in Console Mode**
```bash
EMAIL_SERVICE=console
```
Submit a feedback form - you should see email logged in console.

**Step 2: Test with SMTP**
```bash
EMAIL_SERVICE=smtp
```
Submit a feedback form - check `customerservice@offaxisdeals.com` inbox.

### 3. Verify "From" Address Permissions

Some email providers require you to verify "from" addresses:
- Check PrivateEmail settings
- Make sure you're allowed to send FROM `sales@` and `noreply@`
- If not, you may need to authenticate each separately (see below)

## 🔄 Alternative: Multiple SMTP Configurations

If your provider **requires separate authentication** for each email address, you can set up multiple configurations:

### Option A: Multiple Configs in Code (Advanced)

This would require code changes to support `SMTP_USER_SALES` and `SMTP_USER_NOREPLY`. Currently not implemented.

### Option B: Verify All Addresses

Most providers (including PrivateEmail) allow you to send FROM any verified address once authenticated. Check your PrivateEmail settings to ensure all three addresses are verified/allowed.

## 📝 Quick Checklist

- [ ] SMTP credentials in `.env.local`
- [ ] `EMAIL_SERVICE=smtp` set
- [ ] All three email addresses exist in PrivateEmail
- [ ] Tested with `EMAIL_SERVICE=console` first
- [ ] Tested with `EMAIL_SERVICE=smtp`
- [ ] Verified emails arrive at correct inboxes
- [ ] Checked spam folder if emails don't arrive

## 🆘 Troubleshooting

### "From address not allowed" error
- Verify all three addresses exist in PrivateEmail
- Check PrivateEmail allows sending from those addresses
- Some providers require addresses to be "verified" first

### Emails go to spam
- Add SPF/DKIM records for your domain
- Use consistent "from" addresses
- Include proper email headers

### Authentication fails
- Double-check `SMTP_PASS` is correct
- Verify `SMTP_USER` matches exactly
- Try port 587 with `SMTP_SECURE=false` if 465 doesn't work

