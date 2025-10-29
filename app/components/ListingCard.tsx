'use client';

import Image from 'next/image';

export type ListingLike = {
  id: string | number;
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  price?: number | string;
  bedrooms?: number;
  bathrooms?: number;
  home_sqft?: number;
  lot_size?: number;
  garage?: boolean;
  year_built?: number;
  assignment_fee?: number;
  description?: string;
  owner_phone?: string;
  owner_email?: string;
  owner_name?: string;
  images?: string[];
  cover_image_url?: string;
  arv?: number | string;
  repairs?: number | string;
  spread?: number | string;
  roi?: number | string; // percent
  featured?: boolean;
  featured_until?: string;
};

type Props = { listing: ListingLike };

const toNum = (v: unknown): number | undefined => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

const money = (n?: number) =>
  n === undefined ? '—' : n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function ListingCard({ listing }: Props) {
  const href = `/listing/${listing.id}`;
  const price = toNum(listing.price);
  const beds = listing.bedrooms;
  const baths = listing.bathrooms;
  const sqft = listing.home_sqft;
  
  const description = listing.description;
  
  const address =
    listing.address ??
    [listing.title, [listing.city, listing.state].filter(Boolean).join(', '), listing.zip]
      .filter(Boolean)
      .join(', ');

  const img = listing.cover_image_url ?? (listing.images && listing.images[0]) ?? null;
  
  // Debug logging for image issues
  console.log('ListingCard image debug:', {
    id: listing.id,
    cover_image_url: listing.cover_image_url,
    images: listing.images,
    finalImg: img,
    hasImage: !!img
  });
  
  const arv = toNum(listing.arv);
  const repairs = toNum(listing.repairs);
  const spread = toNum(listing.spread);
  const roi = toNum(listing.roi);

  // Check if listing is currently featured
  const isFeatured = listing.featured && (!listing.featured_until || new Date(listing.featured_until) > new Date());

  return (
    <div style={{ 
      border: isFeatured ? '2px solid #f59e0b' : '1px solid #e5e7eb', 
      borderRadius: 8, 
      overflow: 'hidden',
      background: isFeatured ? '#fffbeb' : '#fff',
      position: 'relative',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      transition: 'box-shadow 0.2s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    }}
    onClick={() => window.location.href = href}
    >
      {/* Image Section */}
      <div style={{ position: 'relative', width: '100%', height: '200px', overflow: 'hidden', background: '#f3f4f6' }}>
        {img ? (
          <Image 
            src={img} 
            alt={address || 'Property image'} 
            fill 
            style={{ objectFit: 'cover' }} 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={(e) => {
              console.error('Image failed to load:', img, e);
              // Try to reload the image after a short delay
              setTimeout(() => {
                const imgElement = e.target as HTMLImageElement;
                if (imgElement) {
                  imgElement.src = img;
                }
              }, 1000);
            }}
            onLoad={() => {
              console.log('Image loaded successfully:', img);
            }}
          />
        ) : (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#9ca3af', 
            fontSize: '14px', 
            background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏠</div>
              <div>No Image Available</div>
            </div>
          </div>
        )}

        {/* Featured Badge - Only overlay we keep */}
        {isFeatured && (
          <div style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: 'white',
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: '600',
            borderRadius: 4,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: 10
          }}>
            ⭐ FEATURED
          </div>
        )}
      </div>

      {/* Content Section */}
      <div style={{ padding: '12px' }}>
        {/* Price */}
        <div style={{ fontWeight: '700', fontSize: '18px', color: '#111', marginBottom: '4px' }}>
          {money(price)}
        </div>
        
        {/* Property Details */}
        <div style={{ color: '#111', fontSize: '14px', marginBottom: '4px' }}>
          {beds !== undefined ? beds + ' bd' : '—'} • {baths !== undefined ? baths + ' ba' : '—'} •{' '}
          {sqft !== undefined ? sqft.toLocaleString() + ' sqft' : '—'}
        </div>
        
        {/* Address */}
        <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '8px', lineHeight: 1.3 }}>
          {address || '—'}
        </div>

        {/* Investment Metrics - HIGHLIGHTED for investors */}
        {(arv !== undefined || repairs !== undefined) && (
          <div style={{
            background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
            border: '1px solid #0ea5e9',
            borderRadius: 6,
            padding: '8px',
            marginBottom: '8px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#0369a1', marginBottom: '4px' }}>
              💰 Investment Opportunity
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {arv !== undefined && (
                <div style={{ fontSize: '11px', color: '#0c4a6e' }}>
                  <strong>ARV:</strong> {money(arv)}
                </div>
              )}
              {repairs !== undefined && (
                <div style={{ fontSize: '11px', color: '#0c4a6e' }}>
                  <strong>Repairs:</strong> {money(repairs)}
                </div>
              )}
              {spread !== undefined && spread > 0 && (
                <div style={{ fontSize: '11px', color: '#0c4a6e' }}>
                  <strong>Spread:</strong> {money(spread)}
                </div>
              )}
              {roi !== undefined && roi > 0 && (
                <div style={{ fontSize: '11px', color: '#0c4a6e' }}>
                  <strong>ROI:</strong> {roi}%
                </div>
              )}
            </div>
          </div>
        )}

        {/* Description preview */}
        {description && (
          <div style={{ color: '#6b7280', fontSize: '12px', lineHeight: 1.4, marginBottom: '8px', maxHeight: '2.8em', overflow: 'hidden' }}>
            {description && description.length > 80 ? description.substring(0, 80) + '...' : description}
          </div>
        )}

        {/* View Details Link */}
        <div style={{ color: '#3b82f6', fontSize: '12px', fontWeight: '600' }}>
          View Details →
        </div>
      </div>
    </div>
  );
}