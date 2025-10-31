# Complete Testing Guide for Off Axis Deals

## 🚀 **STEP 1: Database Setup**

### Run the SQL Script
1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the entire contents of `SETUP_PROFILES_AND_TESTING.sql`**
4. **Click "Run"**

This will:
- ✅ Set up proper profile structure
- ✅ Create test accounts for all roles and tiers
- ✅ Create missing tables for features
- ✅ Set up proper RLS policies

## 🧪 **STEP 2: Test Account Setup**

### Admin Account (Full Access)
- **Email**: `admin@offaxisdeals.com` (REPLACE WITH YOUR EMAIL)
- **Role**: Admin
- **Access**: Full admin dashboard access

### Test Accounts Created
| Email | Role | Tier | Access Level |
|-------|------|------|--------------|
| `investor.free@test.com` | Investor | Free | Limited access |
| `investor.basic@test.com` | Investor | Basic | Basic features |
| `investor.pro@test.com` | Investor | Pro | Full features |
| `wholesaler.free@test.com` | Wholesaler | Free | Limited access |
| `wholesaler.basic@test.com` | Wholesaler | Basic | Basic features |
| `wholesaler.pro@test.com` | Wholesaler | Pro | Full features |

## 🔐 **STEP 3: Authentication Setup**

### Option A: Create Users in Supabase Dashboard (Recommended)
1. **Go to Supabase Dashboard → Authentication → Users**
2. **Click "Add User" or "Invite User"**
3. **Enter the email address** (e.g., `investor.free@test.com`)
4. **Set a password** (you choose the password - make it easy for testing like `test1234`)
5. **Check "Auto Confirm User"** so they can login immediately
6. **Click "Create User"**
7. **Repeat for all test accounts**

**Important**: You set the password when creating the user. Use simple passwords like `test1234` or `password123` for easy testing.

### Option B: Use Magic Links (Email-based)
1. **Go to your app's login page**
2. **Enter each test email**
3. **Check the email inbox** (if configured) or Supabase Auth logs for magic links
4. **Note**: Magic links require email configuration in Supabase

### Option C: Sign Up Through Your App
1. **Go to `/signup` page**
2. **Sign up with each test email**
3. **The profile will be created automatically** (if you have a trigger set up)
4. **Then run the SQL script** to update their roles and tiers

## 🎯 **STEP 4: Feature Testing Checklist**

### ✅ **Core Features (Should Work Immediately)**

#### **1. User Authentication**
- [ ] Login with test accounts
- [ ] Role switching works
- [ ] Profile creation/updates

#### **2. Listings System**
- [ ] Browse listings (`/listings`)
- [ ] View individual listings (`/listing/[id]`)
- [ ] Create new listings (`/my-listings/new`)
- [ ] Edit/delete own listings (`/my-listings`)

#### **3. Map Integration**
- [ ] Map loads without errors
- [ ] No flickering on desktop
- [ ] Mobile map works (check error handling)
- [ ] Spatial filtering works

#### **4. Pricing System**
- [ ] Pricing page loads (`/pricing`)
- [ ] Plan selection works
- [ ] Stripe integration (if configured)

#### **5. Contact System**
- [ ] Contact buttons work on listings
- [ ] Contact sales form (`/contact-sales`)
- [ ] No Calendly redirects

### ⚠️ **Admin Features (Requires Admin Role)**

#### **6. Admin Dashboard**
- [ ] Access `/admin` (admin role required)
- [ ] View all feature pages
- [ ] Test stub implementations

#### **7. Feature Pages (Stub Implementations)**
- [ ] `/admin/alerts` - Alerts management
- [ ] `/admin/watchlists` - Watchlists management  
- [ ] `/admin/analytics` - Analytics dashboard
- [ ] `/admin/reports` - Reports export
- [ ] `/admin/support` - Support tickets
- [ ] `/admin/feedback` - Feedback system

### 🚧 **Features Needing Implementation**

#### **8. Missing Features (Not Yet Implemented)**
- [ ] Team management (`/orgs/[slug]/members`)
- [ ] White-label branding (`/orgs/[slug]/branding`)
- [ ] CRM export (`/settings/integrations/crm`)
- [ ] Off-market feed (`/data-feed`)
- [ ] Custom integrations (`/integrations`)
- [ ] Repair estimator (`/repair-estimator`)
- [ ] Investor chat system
- [ ] Verified badge system

## 🔍 **STEP 5: Testing Specific Issues**

### **Map Issues**
1. **Desktop**: Check for flickering when moving map
2. **Mobile**: Check for "Google Maps Error" and fallback UI
3. **Performance**: Verify listings filter quickly when moving map

### **Mobile UI Issues**
1. **Welcome Page**: Should load as landing page
2. **Responsive Design**: Check on different screen sizes
3. **App Store Links**: Should appear in footer

### **Paywall Testing**
1. **Free Users**: Should see upgrade modals for premium features
2. **Basic Users**: Should have access to basic features
3. **Pro Users**: Should have access to all features

## 🐛 **STEP 6: Common Issues & Solutions**

### **"Access Denied" on Admin Pages**
- **Solution**: Make sure your user has `role: 'admin'` in profiles table

### **Google Maps Not Loading**
- **Solution**: Check `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in environment variables

### **Stripe Errors**
- **Solution**: Check `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### **Database Connection Issues**
- **Solution**: Check Supabase URL and anon key in environment variables

## 📊 **STEP 7: Performance Testing**

### **Load Testing**
1. **Listings Page**: Should load within 3 seconds
2. **Map Rendering**: Should be smooth without stuttering
3. **Image Loading**: All property images should load

### **Mobile Testing**
1. **Touch Interactions**: Map should respond to touch
2. **Responsive Layout**: Should work on phones and tablets
3. **Error Handling**: Should show user-friendly errors

## 🎯 **STEP 8: What I Need From You**

### **Immediate Actions Required**
1. **Run the SQL script** in Supabase
2. **Set up test accounts** in Supabase Auth
3. **Test the admin dashboard** with admin account
4. **Verify mobile functionality** on actual device

### **Environment Variables Needed**
```bash
# Required for full functionality
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your_map_id_here
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### **Optional for Testing**
```bash
# For email functionality
SALES_EMAIL=sales@offaxisdeals.com
SUPPORT_EMAIL=support@offaxisdeals.com
```

## 🚀 **STEP 9: Deployment Checklist**

### **Before Going Live**
- [ ] All test accounts work
- [ ] Admin dashboard accessible
- [ ] Mobile UI looks professional
- [ ] Map loads without errors
- [ ] Stripe integration works
- [ ] Contact forms send emails
- [ ] SEO meta tags are set

### **Post-Deployment**
- [ ] Monitor error logs
- [ ] Test on real devices
- [ ] Verify all features work
- [ ] Check performance metrics

## 📞 **Support**

If you encounter any issues:
1. **Check the console logs** for specific errors
2. **Verify environment variables** are set correctly
3. **Test with different user roles** to isolate issues
4. **Check Supabase logs** for database errors

---

**Ready to test? Start with Step 1 and work through each section systematically!** 🎯
