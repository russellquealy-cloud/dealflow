# Google Cloud Setup Checklist for Geocoding API

## ✅ What's Already Done (from your screenshots)

1. ✅ **Geocoding API is Enabled** - I can see it's enabled in your APIs & Services page
2. ✅ **API Key is Set in Vercel** - `GOOGLE_GEOCODE_API_KEY` is configured
3. ✅ **API is Being Used** - Shows 33 requests in last 30 days
4. ✅ **Billing is Active** - Shows $0.00 (within free tier)

## 🔍 What to Check Next

### 1. Verify API Key Restrictions

**Go to:** Google Cloud Console → APIs & Services → Credentials

**Steps:**
1. Click on your API key (the one starting with `AIzaSyDvv9AQSNHH9pWdV1d6FP1QWNHJ8...`)
2. Check **"API restrictions"** section:
   - **Option A (Recommended for testing):** Select "Don't restrict key"
   - **Option B (Production):** Select "Restrict key" and ensure these APIs are checked:
     - ✅ Geocoding API
     - ✅ Places API (if you use it)
     - ✅ Maps JavaScript API (if you use it)
3. Check **"Application restrictions"** section:
   - For server-side API calls (like your `/api/geocode` route), you have two options:
     - **Option A (Easiest for testing):** Select "None"
     - **Option B (More secure):** Select "IP addresses" and add:
       - Vercel server IP ranges (check Vercel docs for current IPs)
       - Your development machine IP (for local testing)

**⚠️ Common Issue:** If "Application restrictions" is set to "HTTP referrers" (for web apps), it will block server-side API calls. You need "IP addresses" or "None" for server-side use.

### 2. Verify Billing Account

**Go to:** Google Cloud Console → Billing

**Check:**
- ✅ Billing account is linked to your project
- ✅ Billing is enabled (even if you're in free tier, billing must be enabled)
- ✅ No payment issues or suspended accounts

### 3. Test API Key Directly

**Test from command line or browser:**

```bash
# Replace YOUR_KEY with your actual API key
curl "https://maps.googleapis.com/maps/api/geocode/json?address=Tucson,AZ&key=YOUR_KEY"
```

**Expected response:**
```json
{
  "results": [
    {
      "geometry": {
        "location": {
          "lat": 32.2226066,
          "lng": -110.9747108
        }
      }
    }
  ],
  "status": "OK"
}
```

**If you get errors:**
- `REQUEST_DENIED` → API restrictions or application restrictions are blocking it
- `INVALID_REQUEST` → API key format issue
- `OVER_QUERY_LIMIT` → Quota exceeded (unlikely with only 33 requests)

### 4. Check Quotas

**Go to:** Google Cloud Console → APIs & Services → Quotas

**Verify:**
- Geocoding API quotas are not exceeded
- Free tier limits: 10,000 requests per month (you're at 33, so plenty of room)

### 5. Verify Project Selection

**Make sure you're checking the right project:**
- Your screenshots show project: `deal-flow-474216`
- Make sure the API key in Vercel is from the same project
- You can verify by checking the key's "Project" field in Credentials page

## 🚨 Most Common Issues

### Issue 1: Application Restrictions Set to HTTP Referrers
**Problem:** Server-side API calls don't have HTTP referrers, so they get blocked.

**Fix:** Change "Application restrictions" to "IP addresses" or "None" for server-side keys.

### Issue 2: API Restrictions Missing Geocoding API
**Problem:** Key is restricted to only Maps JavaScript API, but not Geocoding API.

**Fix:** Add "Geocoding API" to the allowed APIs list.

### Issue 3: Wrong API Key
**Problem:** Using a key that's restricted or from a different project.

**Fix:** Verify the key in Vercel matches the one in Google Cloud Console.

## 📝 Quick Fix Steps (Recommended)

1. **Go to:** APIs & Services → Credentials
2. **Click on your API key**
3. **Under "Application restrictions":**
   - Temporarily set to "None" (for testing)
   - Or set to "IP addresses" and add Vercel IPs
4. **Under "API restrictions":**
   - Set to "Don't restrict key" (for testing)
   - Or ensure "Geocoding API" is in the allowed list
5. **Click "Save"**
6. **Wait 1-2 minutes** for changes to propagate
7. **Test your app again**

## 🔐 Production Security (After Testing)

Once it's working, tighten security:

1. **Create separate API keys:**
   - One for client-side (Maps JavaScript API) with HTTP referrer restrictions
   - One for server-side (Geocoding API) with IP address restrictions

2. **Restrict server-side key:**
   - API restrictions: Only Geocoding API, Places API (if needed)
   - Application restrictions: IP addresses (Vercel server IPs)

3. **Monitor usage:**
   - Set up billing alerts
   - Monitor quotas in the Quotas page

## ✅ Verification Checklist

- [ ] Geocoding API is enabled (✅ Already done)
- [ ] API key has Geocoding API in allowed APIs (or no restrictions)
- [ ] Application restrictions allow server-side calls (IP addresses or None)
- [ ] Billing account is linked and active (✅ Already done)
- [ ] API key in Vercel matches the one in Google Cloud
- [ ] Test API call works from command line
- [ ] App works after changes

## 🧪 Test Command

Run this in your terminal (replace YOUR_KEY):

```bash
curl "https://maps.googleapis.com/maps/api/geocode/json?address=Tucson,AZ&key=YOUR_KEY"
```

If this works, your API key is correct and the issue is elsewhere. If it fails, the error message will tell you what's wrong.

