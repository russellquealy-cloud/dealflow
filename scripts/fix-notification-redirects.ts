import { getSupabaseServiceRole } from '@/lib/supabase/service';

async function main() {
  const supabase = await getSupabaseServiceRole();
  const { data, error } = await supabase
    .from('notifications')
    .select('id, metadata')
    .is('metadata->listingId', null);

  if (error) {
    console.error('Failed to scan notifications:', error);
    process.exitCode = 1;
    return;
  }

  if (!data?.length) {
    console.log('No notifications missing listingId metadata.');
    return;
  }

  console.log(`Updating ${data.length} notifications to include listingId when trimming fallback...`);

  for (const row of data) {
    if (!row.metadata || typeof row.metadata !== 'object') continue;
    const meta = row.metadata as Record<string, unknown>;
    if (typeof meta.threadId !== 'string') continue;

    const { data: message } = await supabase
      .from('messages')
      .select('listing_id')
      .eq('thread_id', meta.threadId)
      .is('listing_id', null)
      .limit(1)
      .maybeSingle();

    if (!message?.listing_id) continue;

    await supabase
      .from('notifications')
      .update({ metadata: { ...meta, listingId: message.listing_id } })
      .eq('id', row.id);
  }

  console.log('Metadata repair pass complete.');
}

main().catch((error) => {
  console.error('Migration script failed:', error);
  process.exitCode = 1;
});


