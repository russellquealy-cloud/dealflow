'use client';

import React from 'react';

type Role = 'investor' | 'wholesaler' | (string & {});
export type Profile = {
  name?: string;
  phone?: string;
  role?: Role;
  company?: string;
  website?: string;
  markets?: string; // comma-separated
  bio?: string;
};

const label: React.CSSProperties = { display: 'block', fontSize: 12, color: '#555' };
const input: React.CSSProperties = { padding: 8, border: '1px solid #d1d5db', borderRadius: 8, width: '100%' };

export default function ProfileForm({
  initial,
  defaultRole,
}: {
  initial?: Profile;
  defaultRole?: Role;
}) {
  const [form, setForm] = React.useState<Profile>(() => ({
    role: defaultRole,
    ...(initial ?? {}),
  }));

  const onInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  return (
    <form className="space-y-3">
      <input type="hidden" name="role" value={form.role ?? ''} />

      <label style={label}>Name</label>
      <input name="name" style={input} value={form.name ?? ''} onChange={onInput} />

      <label style={label}>Phone</label>
      <input name="phone" style={input} value={form.phone ?? ''} onChange={onInput} />

      <label style={label}>Role</label>
      <select name="role" style={input} value={form.role ?? ''} onChange={onInput}>
        <option value="">Select</option>
        <option value="Wholesaler">Wholesaler</option>
        <option value="Investor">Investor</option>
        {/* keep flexible */}
        {defaultRole && !['Wholesaler', 'Investor'].includes(defaultRole) && (
          <option value={defaultRole}>{defaultRole}</option>
        )}
      </select>

      <label style={label}>Company</label>
      <input name="company" style={input} value={form.company ?? ''} onChange={onInput} />

      <label style={label}>Website</label>
      <input name="website" style={input} value={form.website ?? ''} onChange={onInput} />

      <label style={label}>Markets (comma-separated)</label>
      <input name="markets" style={input} value={form.markets ?? ''} onChange={onInput} />

      <label style={label}>Bio</label>
      <textarea name="bio" style={input} rows={4} value={form.bio ?? ''} onChange={onInput} />
    </form>
  );
}
