'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function ProfileForm({ defaultRole }: { defaultRole:'wholesaler'|'investor' }) {
  const [fullName,setFullName]=useState(''); const [company,setCompany]=useState(''); const [phone,setPhone]=useState('');
  const [role,setRole]=useState<'wholesaler'|'investor'>(defaultRole); const [saving,setSaving]=useState(false); const [msg,setMsg]=useState<string|null>(null);

  async function onSubmit(e:React.FormEvent){ e.preventDefault(); setSaving(true); setMsg(null);
    const { data:{ user }, error:uerr } = await supabase.auth.getUser();
    if (uerr || !user){ setMsg(uerr?.message||'Please log in.'); setSaving(false); return; }
    const { error } = await supabase.from('profiles').upsert({ id:user.id, full_name:fullName, company, phone, role });
    setSaving(false); setMsg(error ? error.message : 'Saved');
  }

  const label={display:'block',fontSize:14,marginBottom:6};
  const input={width:'100%',padding:10,border:'1px solid #d1d5db',borderRadius:8,marginBottom:12} as React.CSSProperties;
  const btn={width:'100%',padding:12,border:'1px solid #111827',background:'#111827',color:'#fff',borderRadius:8,cursor:'pointer'};

  return (<form onSubmit={onSubmit} style={{maxWidth:480,margin:'24px auto'}}>
    <label style={label}>Full name</label><input style={input} value={fullName} onChange={e=>setFullName(e.target.value)} />
    <label style={label}>Company</label><input style={input} value={company} onChange={e=>setCompany(e.target.value)} />
    <label style={label}>Phone</label><input style={input} value={phone} onChange={e=>setPhone(e.target.value)} />
    <label style={label}>Role</label>
    const onInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;
  setForm((f) => ({ ...f, [name]: value }));
};
const onSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const { name, value } = e.target;
  setForm((f) => ({ ...f, [name]: value }));
};
// use onInput/onSelect in your inputs/selects

      <option value="wholesaler">Wholesaler</option><option value="investor">Investor</option>
    </select>
    <button style={btn} disabled={saving} type="submit">{saving?'Saving…':'Save profile'}</button>
    {msg && <p style={{marginTop:10}}>{msg}</p>}
  </form>);
}
