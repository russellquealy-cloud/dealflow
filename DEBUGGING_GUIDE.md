# 🐛 Debugging Guide for Map Loading Issues

## Quick Debugging Steps

### 1. Check Environment Variables
Visit: `http://localhost:3000/envtest`

This will show you:
- ✅ Supabase URL and Key status
- ✅ Google Maps API Key status  
- ✅ Google Maps Map ID status
- ✅ Browser environment info

### 2. Test Map Component Directly
Visit: `http://localhost:3000/map-test`

This will show you:
- ✅ Map loading status with debug panel
- ✅ Real-time error information
- ✅ Environment variable status
- ✅ Points loading status

### 3. Check Console Logs
Open browser dev tools and look for:
- ❌ Google Maps API errors
- ❌ Network request failures
- ❌ JavaScript errors
- ❌ React component errors

## Common Issues & Solutions

### Issue 1: "Google Maps API Key Missing"
**Solution:** Add to your `.env.local` file:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### Issue 2: "Map ID Error" 
**Solution:** Add to your `.env.local` file:
```
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your_map_id_here
```

### Issue 3: "Failed to load Google Maps API"
**Solutions:**
1. Check API key is valid and has Maps JavaScript API enabled
2. Check API key restrictions (domain/IP)
3. Check billing is enabled on Google Cloud Console
4. Check API quotas haven't been exceeded

### Issue 4: Map Flickering/Not Loading
**Solutions:**
1. Clear browser cache and cookies
2. Check for JavaScript errors in console
3. Verify all environment variables are loaded
4. Check network tab for failed requests

### Issue 5: "Cannot create markers" errors
**Solutions:**
1. Ensure map is fully loaded before creating markers
2. Check that points have valid lat/lng coordinates
3. Verify Google Maps API is loaded

## Debug Commands

### Check if environment variables are loaded:
```bash
# In your terminal, run:
echo $NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

### Clear Next.js cache:
```bash
rm -rf .next
npm run dev
```

### Check Google Maps API status:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Check your API key status
4. Verify Maps JavaScript API is enabled

## Testing URLs

- **Main App:** `http://localhost:3000/listings`
- **Environment Test:** `http://localhost:3000/envtest`  
- **Map Test:** `http://localhost:3000/map-test`
- **Simple Map:** `http://localhost:3000/map`

## What to Look For

### ✅ Good Signs:
- Map loads without errors
- Markers appear on map
- No console errors
- Smooth interactions

### ❌ Bad Signs:
- Red error screens
- Console errors about API keys
- Map not loading at all
- Flickering or jumping
- "Cannot create markers" errors

## Next Steps

1. **First:** Visit `/envtest` to check environment variables
2. **Second:** Visit `/map-test` to test map component in isolation  
3. **Third:** Check browser console for specific error messages
4. **Fourth:** Share the specific error messages you see

## Need Help?

If you're still seeing issues, please share:
1. What you see on `/envtest` page
2. What you see on `/map-test` page  
3. Any console error messages
4. Screenshots of any error screens
