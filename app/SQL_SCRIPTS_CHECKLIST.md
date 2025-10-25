# SQL Scripts Checklist for Supabase

## 📋 **Complete List of SQL Scripts to Run in Supabase**

### 1. **Main Subscription Schema** ⭐ **REQUIRED**
**📁 File:** `app/create-subscription-schema.sql`
**🔗 Click to open:** [create-subscription-schema.sql](app/create-subscription-schema.sql)
- Creates subscription system tables
- Adds featured listing fields to listings table
- Sets up RLS policies
- Inserts subscription plans
- **Status:** ✅ Fixed (all duplicate policy errors resolved)

### 2. **Admin Profile System** ⭐ **REQUIRED**
**📁 File:** `app/create-admin-profile-schema.sql`
**🔗 Click to open:** [create-admin-profile-schema.sql](app/create-admin-profile-schema.sql)
- Updates profiles table with comprehensive fields
- Creates admin analytics and metrics tables
- Sets up admin-only RLS policies
- Creates admin dashboard view
- **Status:** ✅ New file created

### 3. **Promote Your Account to Admin** ⭐ **REQUIRED**
**📁 File:** `app/promote-admin.sql`
**🔗 Click to open:** [promote-admin.sql](app/promote-admin.sql)
- Contains SQL to promote your account to admin
- Replace email with your actual email address
- **Status:** ✅ Ready to use

### 4. **Existing Scripts (if not already run)**
**📁 File:** `app/fix-profiles-table.sql`
**🔗 Click to open:** [fix-profiles-table.sql](app/fix-profiles-table.sql)
- Fixes profiles table structure
- **Status:** ✅ May already be applied

**📁 File:** `app/seed-buyer-data.sql`
**🔗 Click to open:** [seed-buyer-data.sql](app/seed-buyer-data.sql)
- Seeds test data
- **Status:** ✅ Optional

## 🚀 **Step-by-Step Instructions**

### **Step 1: Run Main Subscription Schema**
1. Open Supabase SQL Editor
2. Copy and paste the entire content of `app/create-subscription-schema.sql`
3. Click "Run" - this should work without errors now

### **Step 2: Run Admin Profile System**
1. Copy and paste the entire content of `app/create-admin-profile-schema.sql`
2. Click "Run"

### **Step 3: Promote Your Account to Admin**
1. Open `app/promote-admin.sql`
2. Replace `'your-email@example.com'` with your actual email
3. Run the SQL in Supabase SQL Editor

### **Step 4: Verify Admin Access**
1. Log into your app
2. You should see a "🔒 Admin" link in the header
3. Click it to access the admin dashboard

## 🔍 **What Each Script Does**

### **create-subscription-schema.sql**
- ✅ Creates subscription tables (subscriptions, subscription_usage, contact_logs, ai_analysis_logs)
- ✅ Creates subscription_plans table with all pricing tiers
- ✅ Adds featured listing fields to listings table
- ✅ Sets up Row Level Security (RLS) policies
- ✅ Inserts all 8 subscription plans with correct pricing
- ✅ Creates usage tracking functions

### **create-admin-profile-schema.sql**
- ✅ Updates profiles table with role-specific fields
- ✅ Creates admin analytics tables
- ✅ Creates user activity logging
- ✅ Creates system settings table
- ✅ Sets up admin-only RLS policies
- ✅ Creates admin dashboard view
- ✅ Creates functions for promoting users to admin

### **promote-admin.sql**
- ✅ Contains SQL to promote your account to admin
- ✅ Sets role = 'admin', membership_tier = 'enterprise'
- ✅ Verifies the promotion worked

## ⚠️ **Important Notes**

1. **Run scripts in order** - the admin schema depends on the subscription schema
2. **Replace email** in promote-admin.sql with your actual email
3. **Check for errors** - if you get any errors, let me know and I'll fix them
4. **Test admin access** - after running all scripts, verify you can access `/admin`

## 🎯 **Expected Results**

After running all scripts, you should have:
- ✅ Complete subscription system with 8 pricing tiers
- ✅ Featured listing functionality
- ✅ Admin dashboard with analytics
- ✅ Your account promoted to admin
- ✅ Admin navigation in header
- ✅ Comprehensive user tracking and metrics

## 📞 **If You Get Errors**

If you encounter any errors:
1. Copy the exact error message
2. Tell me which script caused the error
3. I'll provide a fixed version immediately

## 🔐 **Security Notes**

- Admin access is heavily locked down with RLS policies
- Only users with role = 'admin' can access admin features
- All admin tables have proper RLS policies
- No public access to admin data
