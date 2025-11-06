# Off Axis Deals - Environment Variables Setup Guide

## 🚀 Quick Setup Checklist

### 1. **Copy Environment Template**
```bash
cp env.example .env.local
```

### 2. **Required Variables (Must Have)**

#### **Supabase (Already Working)**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://lwhxmwvvostzlidmnays.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
✅ **Status**: Already configured and working

#### **Google Maps (Already Working)**
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=optional
```
✅ **Status**: Already configured and working

### 3. **Stripe Setup (For Subscriptions)**

#### **Step 1: Create Stripe Account**
1. Go to [stripe.com](https://stripe.com)
2. Sign up for a free account
3. Complete account verification

#### **Step 2: Get API Keys**
1. Go to Stripe Dashboard → Developers → API Keys
2. Copy the **Secret key** (starts with `sk_test_`)
3. Copy the **Publishable key** (starts with `pk_test_`)

#### **Step 3: Create Products in Stripe**
1. Go to Stripe Dashboard → Products
2. Create these products:

**Pro Plan:**
- Name: "Deal Flow Pro"
- Price: $29.00/month
- Copy the Price ID (starts with `price_`)

**Enterprise Plan:**
- Name: "Deal Flow Enterprise" 
- Price: $99.00/month
- Copy the Price ID (starts with `price_`)

#### **Step 4: Set Up Webhook**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://offaxisdeals.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the **Webhook secret** (starts with `whsec_`)

#### **Step 5: Add to .env.local**
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Custom price IDs (if you want to override defaults)
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
```

### 4. **AI Service Setup (Choose One)**

#### **Option A: OpenAI (Recommended)**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create account and add billing
3. Go to API Keys → Create new secret key
4. Copy the key (starts with `sk-`)

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...
AI_ANALYZER_ENABLED=true
```

#### **Option B: Anthropic Claude**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create account and add billing
3. Go to API Keys → Create new key
4. Copy the key (starts with `sk-ant-`)

```bash
# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-...
AI_ANALYZER_ENABLED=true
```

#### **Option C: Local AI (For Development)**
```bash
# Local AI Configuration
LOCAL_AI_ENDPOINT=http://localhost:8000
AI_ANALYZER_ENABLED=true
```

### 5. **Email Service Setup (Choose One)**

#### **Option A: Resend (Recommended)**
1. Go to [resend.com](https://resend.com)
2. Sign up for free account
3. Go to API Keys → Create new key
4. Copy the key (starts with `re_`)

```bash
# Resend Configuration
RESEND_API_KEY=re_...
```

#### **Option B: Postmark**
1. Go to [postmarkapp.com](https://postmarkapp.com)
2. Sign up for free account
3. Go to API Tokens → Create new token
4. Copy the token

```bash
# Postmark Configuration
POSTMARK_API_TOKEN=your-token-here
```

#### **Option C: SendGrid**
1. Go to [sendgrid.com](https://sendgrid.com)
2. Sign up for free account
3. Go to Settings → API Keys → Create API Key
4. Copy the key (starts with `SG.`)

```bash
# SendGrid Configuration
SENDGRID_API_KEY=SG...
```

### 6. **Feature Flags (Optional)**
```bash
# Enable/disable features
AI_ANALYZER_ENABLED=true
PUSH_WEB_ENABLED=true
PUSH_MOBILE_ENABLED=true
SUBSCRIPTIONS_ENABLED=true
BUYER_MATCHING_ENABLED=true
```

### 7. **Development Settings**
```bash
# Development
NODE_ENV=development
DEBUG=dealflow:*

# App URL (for production - REQUIRED)
NEXT_PUBLIC_APP_URL=https://offaxisdeals.com
```

## 🧪 Test Your Setup

### 1. **Test Build**
```bash
npm run build
```

### 2. **Test Locally**
```bash
npm run dev
```

### 3. **Test Features**
- ✅ Map loads without flickering
- ✅ Markers appear without triple drop
- ✅ User registration/login works
- ✅ Listings display correctly
- ✅ Search and filters work

### 4. **Test New Features (After Setup)**
- ✅ Subscription flow works
- ✅ AI analyzer returns results
- ✅ Buyer matching shows results
- ✅ Email notifications send

## 🚨 Common Issues

### **Stripe Webhook Not Working**
- Make sure webhook URL is correct
- Check that all required events are selected
- Verify webhook secret is correct

### **AI Analyzer Not Working**
- Check API key is valid
- Ensure billing is set up on AI service
- Check `AI_ANALYZER_ENABLED=true`

### **Email Not Sending**
- Verify email service API key
- Check email service account is active
- Ensure billing is set up (if required)

### **Build Errors**
- Run `pnpm install --no-frozen-lockfile`
- Check all required environment variables are set
- Verify database migrations are complete

## 📋 Production Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] Stripe webhook endpoint set up
- [ ] Database migrations completed
- [ ] Test data seeded (optional)
- [ ] Build passes without errors
- [ ] All features tested locally

## 🆘 Need Help?

If you encounter issues:

1. **Check the logs**: Look at browser console and terminal output
2. **Verify environment variables**: Make sure all required variables are set
3. **Test individual features**: Enable one feature at a time
4. **Check service status**: Verify Stripe, AI service, and email service are working

---

**Next Steps**: Once you have the environment variables set up, you can test the new features and deploy to production!
