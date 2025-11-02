# 🚀 Quick Setup: Email & AI Analyzer

**Time Required:** 30-60 minutes  
**Cost:** ~$20-50/month initially

---

## 📧 **Email Setup (Resend - Recommended)**

### **Why Resend?**
- ✅ Free tier: 3,000 emails/month (great for beta!)
- ✅ Paid: $20/month for 50,000 emails (when you grow)
- ✅ Easiest setup
- ✅ Great deliverability

### **Step-by-Step:**

1. **Sign Up for Resend**
   - Go to https://resend.com
   - Sign up (free account)
   - Verify your email

2. **Get API Key**
   - Dashboard → **API Keys** → **Create API Key**
   - Name: "Off Axis Deals Production"
   - Copy the key (starts with `re_`)

3. **Add to Vercel**
   - Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
   - Add:
     ```
     RESEND_API_KEY=re_your_key_here
     ```

4. **Test Email** (Optional)
   - Your email system is already coded!
   - Just add the API key and it should work
   - Test by submitting feedback form

**Done! Email system ready!** ✅

---

## 🤖 **AI Analyzer Setup (OpenAI)**

### **Why OpenAI?**
- ✅ GPT-4 gives excellent property analysis
- ✅ Already coded in your app
- ✅ ~$0.01-0.10 per analysis
- ✅ Great quality results

### **Step-by-Step:**

1. **Sign Up for OpenAI**
   - Go to https://platform.openai.com
   - Create account
   - Add payment method (required for API access)
   - Start with $5-10 credit (enough for testing)

2. **Get API Key**
   - Dashboard → **API Keys** → **Create new secret key**
   - Name: "Off Axis Deals"
   - Copy the key (starts with `sk-`)

3. **Add to Vercel**
   - Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
   - Add:
     ```
     OPENAI_API_KEY=sk_your_key_here
     AI_ANALYZER_ENABLED=true
     ```

4. **Test AI Analyzer**
   - Go to `/tools/analyzer` in your app
   - Enter property details
   - Click "Analyze"
   - Should get AI-powered analysis!

**Done! AI Analyzer ready!** ✅

---

## 💰 **Cost Breakdown**

**Initial Costs (Beta):**
- Resend: **FREE** (3,000 emails/month)
- OpenAI: **~$5-10** (testing credits)
- **Total: ~$5-10 one-time**

**Monthly Costs (After Beta Launch):**
- Resend: $20/month (50k emails)
- OpenAI: $10-50/month (depends on usage, ~$0.01-0.10 per analysis)
- **Total: ~$30-70/month**

**Cost Per User (Estimated):**
- If 100 users, each using AI 5 times/month = 500 analyses
- OpenAI: 500 × $0.05 = $25/month
- Email: $20/month
- **Cost per user: ~$0.45/month** (very reasonable!)

---

## ✅ **Verification Checklist**

After setup, test:

### **Email:**
- [ ] Submit feedback form → check email received
- [ ] Contact sales form → check email received
- [ ] Check spam folder (if not in inbox)

### **AI Analyzer:**
- [ ] Go to `/tools/analyzer`
- [ ] Enter test property data
- [ ] Click "Analyze"
- [ ] Should get analysis with spread, ROI, notes

---

## 🔧 **Troubleshooting**

### **Email Not Working?**
- Check API key is correct in Vercel
- Check email in spam folder
- Check Resend dashboard for errors
- Verify domain (if using custom domain)

### **AI Analyzer Not Working?**
- Check API key is correct in Vercel
- Check OpenAI account has credits
- Check browser console for errors
- Check Vercel function logs

---

## 📝 **Next Steps After Setup**

1. ✅ Test both systems
2. ✅ Update user documentation
3. ✅ Add plan limits (Pro plans only for AI)
4. ✅ Monitor usage and costs
5. ✅ Set up billing alerts

---

**Both systems are already coded in your app - you just need to add the API keys!** 🎉
