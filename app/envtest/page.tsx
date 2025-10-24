export default function EnvTest() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING_URL';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'MISSING_KEY';
  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'MISSING_GOOGLE_MAPS_KEY';
  const googleMapsMapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'MISSING_MAP_ID';
  
  return (
    <main style={{ padding: 24 }}>
      <h1>Environment Variables Test</h1>
      <div style={{ marginBottom: 16 }}>
        <h2>Supabase</h2>
        <div>URL: {url}</div>
        <div>KEY starts with: {key.slice(0, 12)}… (length {key.length})</div>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <h2>Google Maps</h2>
        <div>API Key: {googleMapsKey.slice(0, 12)}… (length {googleMapsKey.length})</div>
        <div>Map ID: {googleMapsMapId}</div>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <h2>Browser Environment</h2>
        <div>User Agent: {typeof window !== 'undefined' ? window.navigator.userAgent.slice(0, 50) + '...' : 'Server'}</div>
        <div>Location: {typeof window !== 'undefined' ? window.location.href : 'Server'}</div>
      </div>
    </main>
  );
}
