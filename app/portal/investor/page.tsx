import ProfileForm from '@/components/ProfileForm';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { redirect } from 'next/navigation';

export default async function InvestorPortal(){
  const supabase = createRouteHandlerClient({ cookies });
  const { data:{ session } } = await supabase.auth.getSession();
  if (!session) redirect('/login?next=/portal/investor');
  return (<div style={{padding:24}}><h1 style={{margin:0,marginBottom:12}}>Investor Portal</h1><ProfileForm defaultRole="investor" /></div>);
}
