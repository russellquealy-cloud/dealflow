# Google API Keys Verification Checklist

## ✅ Keys Created

1. **Server-Side Key (Geocoding):**
   - Key: `AIzaSyDvv9AQSNHH9pWdV1d6FPlQWNHJ8hRxojk`
   - Name: `off-axis-deals-server-geocoding`
   - Restrictions: IP addresses, 2 APIs

2. **Client-Side Key (Maps JavaScript):**
   - Key: `AIzaSyBWpvk-o1ozbhOn3eqFcmEJC_iuv2c_ZdE`
   - Name: `API key 1` (consider renaming to `off-axis-deals-client-maps`)
   - Restrictions: HTTP referrers (sites added)

## 🔍 Verification Steps

### Step 1: Verify Server-Side Key Restrictions

**Go to:** Google Cloud Console → APIs & Services → Credentials → Click on `off-axis-deals-server-geocoding`

**Check:**
- [ ] **API restrictions:** Should have ONLY:
  - ✅ Geocoding API
  - ✅ Places API (if you use it)
  - ❌ Should NOT have Maps JavaScript API
- [ ] **Application restrictions:** Should be "IP addresses" with Vercel IPs, OR "None" for now

### Step 2: Verify Client-Side Key Restrictions

**Go to:** Google Cloud Console → APIs & Services → Credentials → Click on `API key 1`

**Check:**
- [ ] **API restrictions:** Should have ONLY:
  - ✅ Maps JavaScript API
  - ✅ Places API (if you use autocomplete)
  - ❌ Should NOT have Geocoding API
- [ ] **Application restrictions:** Should be "HTTP referrers" with:
  - ✅ `https://www.offaxisdeals.com/*`
  - ✅ `https://offaxisdeals.com/*`
  - ✅ `http://localhost:3000/*` (for local dev)

### Step 3: Verify Vercel Environment Variables

**Go to:** Vercel → Project → Settings → Environment Variables

**Check:**
- [ ] `GOOGLE_GEOCODE_API_KEY` = `AIzaSyDvv9AQSNHH9pWdV1d6FPlQWNHJ8hRxojk`
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = `AIzaSyBWpvk-o1ozbhOn3eqFcmEJC_iuv2c_ZdE`
- [ ] Both are set for the correct environments (Production, Preview, Development)

## 🧪 Testing

### Test 1: Server-Side Geocoding API

**From your local machine:**
```bash
curl "https://maps.googleapis.com/maps/api/geocode/json?address=Tucson,AZ&key=AIzaSyDvv9AQSNHH9pWdV1d6FPlQWNHJ8hRxojk"
```

**Expected:** Should return JSON with coordinates

**If it fails:**
- If "REQUEST_DENIED": IP restriction might be blocking (temporarily set to "None" to test)
- If "INVALID_REQUEST": Check API restrictions include Geocoding API

### Test 2: Client-Side Maps API

**After deploying to Vercel:**
1. Visit your site: `https://www.offaxisdeals.com/listings`
2. Open browser console (F12)
3. Check for any Maps API errors
4. Maps should load without errors

**If it fails:**
- Check HTTP referrer restrictions include your domain
- Check API restrictions include Maps JavaScript API
- Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set correctly

## 🚀 Next Steps

1. **Redeploy Vercel project** (to pick up new env vars)
2. **Test geocoding:**
   - Search for "Tucson, AZ" on your site
   - Should geocode successfully
3. **Test maps:**
   - Maps should load on listings page
   - No console errors
4. **Monitor usage:**
   - Check Google Cloud Console → Metrics
   - Watch for successful requests

## ⚠️ Important Notes

- **Wait 1-2 minutes** after saving restrictions for changes to propagate
- **Redeploy Vercel** after updating environment variables
- If server-side key has IP restrictions and fails, temporarily set to "None" to test, then refine later

## 📝 Optional: Rename Client Key

Consider renaming `API key 1` to `off-axis-deals-client-maps` for better organization:
1. Click on the key
2. Change "Name" field
3. Save

---

**Status:** Ready to test! 🎯

