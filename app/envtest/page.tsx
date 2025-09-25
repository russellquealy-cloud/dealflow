export default function EnvTest() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING_URL';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'MISSING_KEY';
  return (
    <main style={{ padding: 24 }}>
      <h1>Env Test</h1>
      <div>URL: {url}</div>
      <div>KEY starts with: {key.slice(0, 12)}… (length {key.length})</div>
    </main>
  );
}
