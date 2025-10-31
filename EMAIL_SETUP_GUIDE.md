# Email Setup Guide for Off Axis Deals

## Quick Setup

Add these to your `.env.local` file:

```bash
# Email Service Type
EMAIL_SERVICE=smtp

# SMTP Configuration (from PrivateEmail/mail.privateemail.com)
SMTP_HOST=mail.privateemail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=customerservice@offaxisdeals.com
SMTP_PASS=your-mailbox-password-here

# Email Identities
SMTP_FROM="Off Axis Deals Support <customerservice@offaxisdeals.com>"
SMTP_REPLY_TO=customerservice@offaxisdeals.com

# Application Email Addresses
SUPPORT_EMAIL=customerservice@offaxisdeals.com
SALES_EMAIL=sales@offaxisdeals.com
NOREPLY_EMAIL=noreply@offaxisdeals.com
```

## Email Address Usage

### 1. **customerservice@offaxisdeals.com** (Support)
- **Used for**: Feedback, bug reports, support requests
- **SMTP_USER**: This is your SMTP authentication user
- **Receives**: All user feedback and support inquiries

### 2. **sales@offaxisdeals.com** (Sales)
- **Used for**: Sales inquiries, enterprise quotes, contact sales form
- **Receives**: Sales-related inquiries from the contact sales page

### 3. **noreply@offaxisdeals.com** (No Reply)
- **Used for**: Automated notifications (message notifications, alerts)
- **Does NOT receive replies**: This is for outbound notifications only
- **Note**: You'll need to set up this mailbox, but it's primarily for sending

## Testing Email Setup

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Set EMAIL_SERVICE=console** temporarily to test without sending real emails:
   ```bash
   EMAIL_SERVICE=console
   ```
   This will log emails to the console instead of sending them.

3. **Test with SMTP**:
   - Set `EMAIL_SERVICE=smtp`
   - Submit a feedback form
   - Check that emails arrive at `customerservice@offaxisdeals.com`

## Troubleshooting

### "SMTP configuration incomplete" error
- Check that all SMTP_* variables are set in `.env.local`
- Verify `SMTP_PASS` is correct (the mailbox password, not account password)

### "Connection refused" or timeout
- Verify `SMTP_HOST` is correct: `mail.privateemail.com`
- Check `SMTP_PORT`: Should be `465` for SSL/TLS or `587` for STARTTLS
- Check `SMTP_SECURE`: Should be `true` for port 465, `false` for port 587
- Ensure firewall isn't blocking outbound SMTP

### "Authentication failed"
- Verify `SMTP_USER` matches exactly: `customerservice@offaxisdeals.com`
- Double-check `SMTP_PASS` is the correct mailbox password
- Try testing with a different email client first (like Thunderbird) to verify credentials

### Emails not arriving
- Check spam/junk folder
- Verify recipient email addresses are correct
- Check SMTP server logs (if available)
- Try using `EMAIL_SERVICE=console` first to verify the code is working

## Advanced Configuration

### Using Different Ports

If port 465 doesn't work, try port 587 with STARTTLS:

```bash
SMTP_PORT=587
SMTP_SECURE=false
```

### Multiple SMTP Accounts

If you need to use different SMTP accounts for different purposes:
1. Set up multiple `.env.local` configurations
2. Or modify `lib/email.ts` to support multiple SMTP configurations
3. Or use environment-specific variables (production vs development)

## Production Checklist

- [ ] All three email addresses are set up and accessible
- [ ] SMTP credentials are tested and working
- [ ] `SMTP_PASS` is stored securely (not committed to git)
- [ ] Email service is set to `smtp` (not `console`)
- [ ] Test feedback form sends emails correctly
- [ ] Test contact sales form sends emails correctly
- [ ] Monitor email delivery in production

