export default async function ApiTest() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return <div style={{padding:24}}>Env missing. URL or KEY undefined.</div>;
  }

  const req = await fetch(`${url}/rest/v1/listings?select=id&limit=1`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    // Next.js caches server fetches by default; force a fresh one to see errors immediately
    cache: 'no-store',
  });

  const text = await req.text();

  return (
    <pre style={{ padding: 24, whiteSpace: 'pre-wrap' }}>
      Status: {req.status} {req.statusText}
      {'\n'}Body: {text}
    </pre>
  );
}
