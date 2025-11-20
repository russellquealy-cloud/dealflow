# Testing Geocoding API Key

## Windows PowerShell Commands

### Option 1: Using curl.exe (Recommended)

Open PowerShell and run:

```powershell
curl.exe "https://maps.googleapis.com/maps/api/geocode/json?address=Tucson,AZ&key=AIzaSyDvv9AQSNHH9pWdV1d6FPlQWNHJ8hRxojk"
```

### Option 2: Using Invoke-WebRequest (PowerShell native)

```powershell
Invoke-WebRequest -Uri "https://maps.googleapis.com/maps/api/geocode/json?address=Tucson,AZ&key=AIzaSyDvv9AQSNHH9pWdV1d6FPlQWNHJ8hRxojk" | Select-Object -ExpandProperty Content
```

### Option 3: Save to file (easier to read)

```powershell
curl.exe "https://maps.googleapis.com/maps/api/geocode/json?address=Tucson,AZ&key=AIzaSyDvv9AQSNHH9pWdV1d6FPlQWNHJ8hRxojk" -o test-response.json
notepad test-response.json
```

## Expected Success Response

You should see JSON like this:

```json
{
  "results": [
    {
      "geometry": {
        "location": {
          "lat": 32.2226066,
          "lng": -110.9747108
        }
      },
      "formatted_address": "Tucson, AZ, USA",
      ...
    }
  ],
  "status": "OK"
}
```

## Error Responses

### If you see "REQUEST_DENIED":
```json
{
  "error_message": "This API key is not authorized for this request.",
  "results": [],
  "status": "REQUEST_DENIED"
}
```
**Fix:** The IP restriction is blocking your local machine. Temporarily set Application restrictions to "None" in Google Cloud Console.

### If you see "INVALID_REQUEST":
```json
{
  "error_message": "Invalid request.",
  "results": [],
  "status": "INVALID_REQUEST"
}
```
**Fix:** Check that the API key format is correct and Geocoding API is enabled.

### If you see "OVER_QUERY_LIMIT":
```json
{
  "error_message": "You have exceeded your rate limit or quota.",
  "results": [],
  "status": "OVER_QUERY_LIMIT"
}
```
**Fix:** You've hit the quota limit (unlikely with only 33 requests so far).

## Quick Test Script

Save this as `test-geocode.ps1`:

```powershell
$apiKey = "AIzaSyDvv9AQSNHH9pWdV1d6FPlQWNHJ8hRxojk"
$address = "Tucson,AZ"
$url = "https://maps.googleapis.com/maps/api/geocode/json?address=$address&key=$apiKey"

Write-Host "Testing Geocoding API..." -ForegroundColor Cyan
Write-Host "URL: $url" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing
    $json = $response.Content | ConvertFrom-Json
    
    if ($json.status -eq "OK") {
        Write-Host "✅ SUCCESS!" -ForegroundColor Green
        Write-Host "Location: $($json.results[0].formatted_address)" -ForegroundColor Green
        Write-Host "Coordinates: $($json.results[0].geometry.location.lat), $($json.results[0].geometry.location.lng)" -ForegroundColor Green
    } else {
        Write-Host "❌ ERROR: $($json.status)" -ForegroundColor Red
        if ($json.error_message) {
            Write-Host "Message: $($json.error_message)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ REQUEST FAILED" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
```

Run it with:
```powershell
.\test-geocode.ps1
```

