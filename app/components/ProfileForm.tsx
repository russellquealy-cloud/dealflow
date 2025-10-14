'use client';

import { useState } from 'react';

type Profile = {
  name?: string;
  phone?: string;
  role?: string;
  bio?: string;
};

const label: React.CSSProperties = { display: 'block', fontSize: 12, color: '#555' };
const input: React.CSSProperties = { padding: 8, border: '1px solid #d1d5db', borderRadius: 8, width: '100%' };

export default function ProfileForm({ initial }: { initial?: Profile }) {
  const [form, setForm] = useState<Profile>(initial ?? {});

  const onInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  return (
    <form className="space-y-3">
      <label style={label}>Phone</label>
      <input name="phone" style={input} value={form.phone ?? ''} onChange={onInput} />

      <label style={label}>Role</label>
      <select name="role" style={input} value={form.role ?? ''} onChange={onInput}>
        <option value="">Select</option>
        <option value="Wholesaler">Wholesaler</option>
        <option value="Investor">Investor</option>
      </select>

      <label style={label}>Bio</label>
      <textarea name="bio" style={input} rows={4} value={form.bio ?? ''} onChange={onInput} />
    </form>
  );
}
