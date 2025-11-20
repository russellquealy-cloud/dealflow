# Google Cloud Production Setup Guide

## Overview

For production, we'll create **two separate API keys**:
1. **Client-side key** - For Maps JavaScript API (browser)
2. **Server-side key** - For Geocoding API (server/API routes)

This provides better security and allows different restrictions for each use case.

---

## Step 1: Create Server-Side API Key (Geocoding)

### 1.1 Create the Key

1. Go to: **Google Cloud Console → APIs & Services → Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"API key"**
3. A new key will be created - **copy it immediately** (you won't see it again)
4. Click **"RESTRICT KEY"** (don't close the dialog yet)

### 1.2 Configure API Restrictions

**Under "API restrictions":**
- Select **"Restrict key"**
- Check ONLY these APIs:
  - ✅ **Geocoding API**
  - ✅ **Places API** (if you use it for autocomplete/search)
  - ✅ **Places Details API** (if you use it)
  - ❌ Do NOT check "Maps JavaScript API" (that's for client-side)

### 1.3 Configure Application Restrictions

**Under "Application restrictions":**
- Select **"IP addresses"**
- Click **"+ ADD AN ITEM"**
- Add Vercel server IP ranges (as of 2024, but verify current IPs):
  ```
  76.76.21.21
  76.223.126.42
  ```
- **Note:** Vercel uses dynamic IPs. For production, you may need to:
  - Option A: Use "None" temporarily, then check Vercel logs for actual IPs
  - Option B: Contact Vercel support for current IP ranges
  - Option C: Use a service like `ip-ranges.vercel.com` if available

**Alternative (if IP addresses don't work):**
- For now, set to **"None"** to get it working
- Monitor Google Cloud logs to see which IPs are making requests
- Then restrict to those specific IPs

### 1.4 Name and Save

1. **Name:** `off-axis-deals-server-geocoding` (or similar)
2. Click **"SAVE"**
3. **Copy the key** - this is your `GOOGLE_GEOCODE_API_KEY`

---

## Step 2: Create Client-Side API Key (Maps JavaScript)

### 2.1 Create the Key

1. Go to: **Google Cloud Console → APIs & Services → Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"API key"**
3. A new key will be created - **copy it immediately**
4. Click **"RESTRICT KEY"**

### 2.2 Configure API Restrictions

**Under "API restrictions":**
- Select **"Restrict key"**
- Check ONLY these APIs:
  - ✅ **Maps JavaScript API**
  - ✅ **Places API** (if you use autocomplete in browser)
  - ❌ Do NOT check "Geocoding API" (that's server-side only)

### 2.3 Configure Application Restrictions

**Under "Application restrictions":**
- Select **"HTTP referrers (web sites)"**
- Click **"+ ADD AN ITEM"**
- Add your production domains:
  ```
  https://www.offaxisdeals.com/*
  https://offaxisdeals.com/*
  ```
- For local development, also add:
  ```
  http://localhost:3000/*
  http://127.0.0.1:3000/*
  ```

### 2.4 Name and Save

1. **Name:** `off-axis-deals-client-maps` (or similar)
2. Click **"SAVE"**
3. **Copy the key** - this is your `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

---

## Step 3: Update Vercel Environment Variables

### 3.1 Server-Side Key (Geocoding)

1. Go to: **Vercel → Your Project → Settings → Environment Variables**
2. Find or create: `GOOGLE_GEOCODE_API_KEY`
3. **Paste the server-side key** (from Step 1)
4. Set environment to: **"Production"** (and Preview/Development if needed)
5. Click **"Save"**

### 3.2 Client-Side Key (Maps)

1. In the same Environment Variables page
2. Find or create: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
3. **Paste the client-side key** (from Step 2)
4. Set environment to: **"All Environments"** (needed for client-side)
5. Click **"Save"**

### 3.3 Verify

Your Vercel environment variables should have:
- ✅ `GOOGLE_GEOCODE_API_KEY` = Server-side key (Production only)
- ✅ `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = Client-side key (All environments)

---

## Step 4: Verify API Key Restrictions

### 4.1 Test Server-Side Key

**From your local machine (to test):**
```bash
# Replace YOUR_SERVER_KEY with your actual server-side key
curl "https://maps.googleapis.com/maps/api/geocode/json?address=Tucson,AZ&key=YOUR_SERVER_KEY"
```

**Expected:** Should return coordinates (if IP restriction allows, or if set to "None")

**If it fails:**
- Check the error message
- If "REQUEST_DENIED", the IP restriction might be blocking you
- Temporarily set to "None" to test, then add your IPs

### 4.2 Test Client-Side Key

**In browser console on your site:**
```javascript
// This should load the Maps API
const script = document.createElement('script');
script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
document.head.appendChild(script);
```

**Expected:** No errors, Maps API loads

---

## Step 5: Deploy and Test

1. **Redeploy your Vercel project** (to pick up new env vars)
2. **Test geocoding:**
   - Search for "Tucson, AZ" on your site
   - Should geocode successfully
3. **Test maps:**
   - Maps should load on your listings page
   - No console errors

---

## Step 6: Monitor and Secure

### 6.1 Set Up Billing Alerts

1. Go to: **Google Cloud Console → Billing → Budgets & alerts**
2. Create a budget alert for unexpected charges
3. Set threshold (e.g., $10/month)

### 6.2 Monitor Usage

1. Go to: **APIs & Services → Metrics**
2. Watch for unusual spikes
3. Check **Quotas** page to ensure you're not hitting limits

### 6.3 Refine IP Restrictions (Optional)

1. After a few days, check **APIs & Services → Metrics**
2. Look at request logs to see actual IPs making requests
3. Refine server-side key restrictions to only those IPs

---

## Security Best Practices

### ✅ Do:
- Use separate keys for client and server
- Restrict keys to only needed APIs
- Use IP restrictions for server-side keys
- Use HTTP referrer restrictions for client-side keys
- Monitor usage regularly
- Set up billing alerts

### ❌ Don't:
- Use the same key for client and server
- Leave keys unrestricted in production
- Commit keys to git
- Share keys publicly
- Use client-side key for server-side calls

---

## Troubleshooting

### Issue: "REQUEST_DENIED" from server

**Possible causes:**
1. IP restriction blocking Vercel servers
2. API restriction missing Geocoding API
3. Wrong key being used

**Fix:**
1. Check API restrictions include Geocoding API
2. Temporarily set Application restrictions to "None" to test
3. Verify correct key in Vercel env vars

### Issue: Maps not loading in browser

**Possible causes:**
1. HTTP referrer restriction blocking your domain
2. API restriction missing Maps JavaScript API
3. Wrong key in `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

**Fix:**
1. Check referrer restrictions include your domain
2. Check API restrictions include Maps JavaScript API
3. Verify key in browser console (should match client-side key)

### Issue: Key works locally but not on Vercel

**Possible causes:**
1. Environment variable not set in Vercel
2. Wrong environment (Production vs Preview)
3. Need to redeploy after setting env vars

**Fix:**
1. Verify env vars in Vercel dashboard
2. Redeploy the project
3. Check Vercel logs for errors

---

## Quick Reference

| Key Type | Environment Variable | Restrictions | Use Case |
|----------|---------------------|--------------|----------|
| Server | `GOOGLE_GEOCODE_API_KEY` | IP addresses | API routes (`/api/geocode`) |
| Client | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | HTTP referrers | Browser (Maps, Autocomplete) |

---

## Final Checklist

Before going live:

- [ ] Server-side key created with Geocoding API restriction
- [ ] Server-side key has IP restrictions (or None for now)
- [ ] Client-side key created with Maps JavaScript API restriction
- [ ] Client-side key has HTTP referrer restrictions
- [ ] Both keys added to Vercel environment variables
- [ ] Vercel project redeployed
- [ ] Geocoding tested and working
- [ ] Maps tested and working
- [ ] Billing alerts configured
- [ ] Usage monitoring set up

---

**Last Updated:** November 19, 2025

