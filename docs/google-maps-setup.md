# Off Axis Deals - Google Maps API Setup Guide

## 🚨 **Current Issue: ApiProjectMapError**

Your app is showing a Google Maps error because the API key needs billing enabled. Here's how to fix it:

## 🔧 **Step 1: Enable Billing (Required)**

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project (or create a new one)

2. **Enable Billing**
   - Go to **Billing** → **Link a billing account**
   - Add a payment method
   - **Don't worry about costs** - Google Maps gives you $200/month free credit

3. **Verify Your API Key**
   - Go to **APIs & Services** → **Credentials**
   - Find your API key and click on it
   - Make sure it's enabled

## 🔧 **Step 2: Configure API Restrictions**

1. **Application Restrictions**
   - Set to **HTTP referrers (web sites)**
   - Add these domains:
     ```
     localhost:3000/*
     *.vercel.app/*
     offaxisdeals.com/*
     *.offaxisdeals.com/*
     ```

2. **API Restrictions**
   - Set to **Restrict key**
   - Enable these APIs:
     - ✅ Maps JavaScript API
     - ✅ Geocoding API
     - ✅ Places API (optional)

## 🔧 **Step 3: Test Your Setup**

1. **Check Console**
   - Open browser dev tools
   - Look for Google Maps errors
   - Should see no "ApiProjectMapError"

2. **Test Map Functionality**
   - Map should load without watermark
   - Markers should appear
   - Zooming should work properly

## 💰 **Cost Information**

- **Free Tier**: $200/month credit
- **Maps JavaScript API**: $7 per 1,000 loads
- **Geocoding**: $5 per 1,000 requests
- **Typical usage**: <$10/month for small apps

## 🚨 **Common Issues**

### **"For development purposes only" watermark**
- ✅ **Solution**: Enable billing in Google Cloud Console

### **"This page can't load Google Maps correctly"**
- ✅ **Solution**: Check API key restrictions and enabled APIs

### **Map loads but no markers**
- ✅ **Solution**: Check if Geocoding API is enabled

## 📞 **Need Help?**

1. **Google Cloud Support**: https://cloud.google.com/support
2. **Maps Documentation**: https://developers.google.com/maps/documentation
3. **Error Reference**: https://developers.google.com/maps/documentation/javascript/error-messages

---

**Once billing is enabled, your map should work perfectly!** 🗺️
