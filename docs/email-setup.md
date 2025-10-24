# Email Configuration for Off Axis Deals

## 📧 **Customer Service Email Setup**

### **Primary Email: customerservice@offaxisdeals.com**

This email will be used for:
- User support inquiries
- Account issues
- Technical support
- General questions

## 🔧 **Email Service Configuration**

### **Option 1: Resend (Recommended)**
1. **Sign up at [resend.com](https://resend.com)**
2. **Add your domain**: `offaxisdeals.com`
3. **Verify domain** with DNS records
4. **Create API key** for the application

**Environment Variables:**
```bash
# Resend Configuration
RESEND_API_KEY=re_...
```

### **Option 2: Postmark**
1. **Sign up at [postmarkapp.com](https://postmarkapp.com)**
2. **Add your domain**: `offaxisdeals.com`
3. **Verify domain** with DNS records
4. **Create server** and get API token

**Environment Variables:**
```bash
# Postmark Configuration
POSTMARK_API_TOKEN=your-token-here
```

### **Option 3: SendGrid**
1. **Sign up at [sendgrid.com](https://sendgrid.com)**
2. **Add your domain**: `offaxisdeals.com`
3. **Verify domain** with DNS records
4. **Create API key**

**Environment Variables:**
```bash
# SendGrid Configuration
SENDGRID_API_KEY=SG...
```

## 📧 **Email Templates to Configure**

### **1. Welcome Email**
- **Trigger**: New user registration
- **From**: `customerservice@offaxisdeals.com`
- **Subject**: "Welcome to Off Axis Deals!"

### **2. Password Reset**
- **Trigger**: Password reset request
- **From**: `customerservice@offaxisdeals.com`
- **Subject**: "Reset your Off Axis Deals password"

### **3. Listing Notifications**
- **Trigger**: New message on listing
- **From**: `customerservice@offaxisdeals.com`
- **Subject**: "New message on your listing"

### **4. Subscription Updates**
- **Trigger**: Payment success/failure
- **From**: `customerservice@offaxisdeals.com`
- **Subject**: "Subscription update"

## 🔧 **Implementation Steps**

### **Step 1: Choose Email Service**
- **Resend**: Easiest setup, great for startups
- **Postmark**: More features, better for high volume
- **SendGrid**: Enterprise features, more complex

### **Step 2: Domain Verification**
1. **Add DNS records** as instructed by your email service
2. **Verify domain** in the service dashboard
3. **Test email delivery** with a test email

### **Step 3: Configure in App**
1. **Add API key** to your `.env.local` file
2. **Update email templates** in `app/lib/notifications.ts`
3. **Test email sending** with the notification system

### **Step 4: Set Up Email Forwarding**
1. **Forward all emails** from `customerservice@offaxisdeals.com` to your personal email
2. **Set up auto-replies** for common questions
3. **Create email aliases** for different departments

## 📋 **Email Aliases to Consider**

- `support@offaxisdeals.com` → `customerservice@offaxisdeals.com`
- `help@offaxisdeals.com` → `customerservice@offaxisdeals.com`
- `info@offaxisdeals.com` → `customerservice@offaxisdeals.com`
- `billing@offaxisdeals.com` → `customerservice@offaxisdeals.com`

## 🚀 **Next Steps**

1. **Choose your email service** (Resend recommended)
2. **Set up domain verification**
3. **Add API key to environment variables**
4. **Test email functionality**
5. **Set up email forwarding to your personal email**

---

**Need help?** Check the main environment setup guide in `docs/environment-setup.md` for complete configuration instructions.
