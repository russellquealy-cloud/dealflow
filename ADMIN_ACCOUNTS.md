# Admin Accounts Analysis

## Two Admin Accounts Found

### Account 1: System/Test Admin
- **ID:** `2157d77d-83b9-4214-b698-3b12ebf18792`
- **Created:** 2025-10-31 02:39:38
- **Status:** Empty account (no name, email, phone, company)
- **Likely Origin:** Auto-created during database seeding or migration
- **Purpose:** System/test account

### Account 2: Russell Quealy (Real Admin)
- **ID:** `bf2050bb-b192-4a32-9f62-f57abad82ea7`
- **Created:** 2025-10-20 00:12:50 (11 days earlier)
- **Name:** Russell Quealy (Admin)
- **Phone:** 5208765309
- **Company:** Wholesalers R Us
- **Location:** Tucson, Arizona
- **Status:** Real user account
- **Purpose:** Actual admin account

## Why Two Accounts?

The first account (`2157d77d`) appears to be:
1. **Auto-created during migration** - Many systems create a default admin account during initial setup
2. **Test account** - Created for testing admin functionality
3. **Orphaned account** - Created during development and never cleaned up

The second account (`bf2050bb`) is clearly the real admin account with actual user data.

## Recommended Actions

### Option 1: Delete the System Account (Recommended)
If the first account is truly unused, delete it:
```sql
DELETE FROM profiles WHERE id = '2157d77d-83b9-4214-b698-3b12ebf18792';
```

### Option 2: Convert to Regular Account
Convert it to a regular investor account instead:
```sql
UPDATE profiles 
SET role = 'investor',
    segment = 'investor',
    tier = 'free',
    type = 'investor'
WHERE id = '2157d77d-83b9-4214-b698-3b12ebf18792';
```

### Option 3: Keep but Mark It
If you want to keep it for reference:
```sql
UPDATE profiles 
SET full_name = 'System Admin (Auto-created)'
WHERE id = '2157d77d-83b9-4214-b698-3b12ebf18792';
```

## Verification

Before deleting, verify the account is not linked to anything:
```sql
-- Check if account has any listings
SELECT COUNT(*) FROM listings WHERE owner_id = '2157d77d-83b9-4214-b698-3b12ebf18792';

-- Check if account has any subscriptions
SELECT COUNT(*) FROM subscriptions WHERE user_id = '2157d77d-83b9-4214-b698-3b12ebf18792';

-- Check if account has any messages
SELECT COUNT(*) FROM messages WHERE from_id = '2157d77d-83b9-4214-b698-3b12ebf18792' 
   OR to_id = '2157d77d-83b9-4214-b698-3b12ebf18792';
```

If all counts are 0, it's safe to delete.

