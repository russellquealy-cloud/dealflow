import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/format';
import ContactButtons from '@/components/ContactButtons';
import { coverUrlFromListing, galleryFromListing } from '@/lib/images';
import ImageGallery from '@/components/ImageGallery';
import WatchlistButton from '@/components/WatchlistButton';
import ListingViewTracker from '@/components/ListingViewTracker';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  // Include views in the query; year_built and garage_spaces are included in *
  const { data, error } = await supabase.from('listings').select('*, views').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return <div style={{ padding: 24 }}>Listing not found.</div>;

  const img = coverUrlFromListing(data);
  const gallery = galleryFromListing(data);
  
  // Debug image loading (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Listing page image debug:', {
      id: id,
      rawData: data,
      coverImageUrl: data.cover_image_url,
      imageUrl: data.image_url,
      images: data.images,
      finalImg: img,
      gallery: gallery
    });
  }

  // Fix Spread and ROI calculations
  const purchasePrice = typeof data.price === 'number' ? data.price : typeof data.price === 'string' ? parseFloat(data.price) || null : null;
  const arv = typeof data.arv === 'number' ? data.arv : typeof data.arv === 'string' ? parseFloat(data.arv) || null : null;
  const repairs = typeof data.repairs === 'number' ? data.repairs : typeof data.repairs === 'string' ? parseFloat(data.repairs) || null : 0;
  
  // Spread = ARV - Purchase Price (gross profit before costs)
  let spread: number | null = null;
  if (purchasePrice != null && arv != null && purchasePrice > 0 && arv > 0) {
    spread = arv - purchasePrice;
  }
  
  // ROI = (Spread - Total Costs) / Total Investment * 100
  // Total Investment = Purchase Price + Repairs + Closing Costs
  let roi: number | null = null;
  if (spread != null && purchasePrice != null && purchasePrice > 0) {
    const totalInvestment = purchasePrice + (repairs || 0);
    if (totalInvestment > 0) {
      const netProfit = spread - (repairs || 0);
      roi = (netProfit / totalInvestment) * 100;
    }
  }
  
  // Format price for display (fallback to 0 for display purposes)
  const price = purchasePrice ?? 0;

  const lotSqft: number | null =
    data.lot_size ?? data.lot_sqft ?? (typeof data.lot_acres === 'number' ? Math.round(data.lot_acres * 43560) : null);

  return (
    <main style={{ padding: 24 }}>
      {/* Track view when page loads */}
      <ListingViewTracker listingId={data.id} />
      
      <div style={{ marginBottom: 16 }}>
        <Link 
          href="/listings" 
          style={{ 
            display: 'inline-block',
            padding: '8px 16px', 
            border: '1px solid #0ea5e9', 
            borderRadius: 8,
            background: '#0ea5e9',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 600,
            marginBottom: 16
          }}
        >
          ← Back to Listings
        </Link>
      </div>
      
      <h1 style={{ margin: 0, marginBottom: 8 }}>{formatCurrency(price)}</h1>
      <div style={{ color: '#6b7280', marginBottom: 16 }}>
        {[data.address, data.city, data.state, data.zip].filter(Boolean).join(', ')}
      </div>

      <ImageGallery 
        coverImage={img || undefined} 
        galleryImages={gallery || []} 
        title={`${formatCurrency(price)} - ${[data.address, data.city, data.state, data.zip].filter(Boolean).join(', ')}`}
      />

      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
        <Info label="Beds" value={data.beds ?? data.bedrooms ?? '—'} />
        <Info label="Baths" value={data.baths ?? data.bathrooms ?? '—'} />
        <Info label="Sq Ft" value={data.sqft ?? data.home_sqft ?? '—'} />
        <Info
          label="Lot"
          value={
            lotSqft
              ? `${lotSqft.toLocaleString()} sqft (${(lotSqft / 43560).toFixed(2)} ac)`
              : data.lot_acres
              ? `${(data.lot_acres as number).toFixed(2)} ac`
              : '—'
          }
        />
        <Info label="Year Built" value={data.year_built ? String(data.year_built) : 'N/A'} />
        <Info 
          label="Garage" 
          value={
            data.garage_spaces != null && data.garage_spaces >= 0
              ? `${data.garage_spaces} ${data.garage_spaces === 1 ? 'space' : 'spaces'}`
              : 'N/A'
          } 
        />
        <Info label="ARV" value={formatCurrency(arv ?? 0)} />
        <Info label="Repairs" value={formatCurrency(repairs ?? 0)} />
        <Info label="Spread" value={spread != null ? formatCurrency(spread) : 'N/A'} />
        <Info label="ROI" value={roi != null ? `${roi.toFixed(1)}%` : 'N/A'} />
      </div>

      <div style={{ marginTop: 18, whiteSpace: 'pre-wrap' }}>{data.description || ''}</div>

      <div style={{ marginTop: 18, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <WatchlistButton listingId={data.id} size="medium" />
        <div style={{ flex: 1 }}>
          <ContactButtons listingId={data.id} />
        </div>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{value}</div>
    </div>
  );
}
