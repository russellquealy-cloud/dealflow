async function submit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setBusy(true);
  setMsg(null);

  // must be logged in (RLS + upload both require auth)
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    setBusy(false);
    setMsg('Please login first to post (see the Login link).');
    return;
  }

  const fd = new FormData(e.currentTarget);
  const file = fd.get('image_file') as File | null;

  // 1) Upload image (if provided) to Supabase Storage
  let uploadedUrl: string | null = null;
  if (file && file.size > 0) {
    // optional light validation
    const maxBytes = 8 * 1024 * 1024; // 8MB
    if (file.size > maxBytes) {
      setBusy(false);
      setMsg('Image too large. Please upload a file under 8MB.');
      return;
    }
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${user.id}/${Date.now()}.${ext}`;

    // Upload to bucket 'listing-images'
    const { error: upErr } = await supabase
      .storage
      .from('listing-images')
      .upload(path, file, { upsert: false });

    if (upErr) {
      setBusy(false);
      setMsg(upErr.message);
      return;
    }

    // Get public URL
    const { data: pub } = supabase
      .storage
      .from('listing-images')
      .getPublicUrl(path);

    uploadedUrl = pub.publicUrl;
  }

  // 2) Insert listing row
  const payload = {
    address: String(fd.get('address') ?? ''),
    city: String(fd.get('city') ?? ''),
    state: String(fd.get('state') ?? ''),
    zip: String(fd.get('zip') ?? ''),
    price: Number(fd.get('price') ?? 0),
    arv: Number(fd.get('arv') ?? 0),
    repairs: Number(fd.get('repairs') ?? 0),
    image_url: uploadedUrl, // now from storage (can be null if no file chosen)
    contact_name: (fd.get('contact_name') ? String(fd.get('contact_name')) : null) as string | null,
    contact_email: String(fd.get('contact_email') ?? ''),
    contact_phone: (fd.get('contact_phone') ? String(fd.get('contact_phone')) : null) as string | null,
    status: 'live' as const,
    owner_id: user.id, // required by RLS policies
  };

  try {
    const { data, error } = await supabase
      .from('listings')
      .insert(payload)
      .select('id')
      .single();

    if (error) throw error;
    window.location.href = `/listing/${data.id}`;
  } catch (e: unknown) {
    setMsg(e instanceof Error ? e.message : String(e));
  } finally {
    setBusy(false);
  }
}
