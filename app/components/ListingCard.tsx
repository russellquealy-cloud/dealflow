'use client';

import Image from 'next/image';
import Link from 'next/link';
import MessageForm from './MessageForm';

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
  const lotSize = toNum(listing.lot_size);
  const garage = listing.garage;
  const yearBuilt = listing.year_built;
  const assignmentFee = toNum(listing.assignment_fee);
  const description = listing.description;
  const ownerPhone = listing.owner_phone;
  const ownerEmail = listing.owner_email;
  // const ownerName = listing.owner_name;
  
  // Debug logging for listing data
  console.log('ListingCard data debug:', {
    id: listing.id,
    price,
    beds,
    baths,
    sqft,
    lotSize,
    garage,
    yearBuilt,
    rawListing: listing
  });
  
  const address =
    listing.address ??
    [listing.title, [listing.city, listing.state].filter(Boolean).join(', '), listing.zip]
      .filter(Boolean)
      .join(', ');

  const img = listing.cover_image_url ?? (listing.images && listing.images[0]) ?? null;
  
  // Debug image loading
  console.log('ListingCard image debug:', {
    id: listing.id,
    cover_image_url: listing.cover_image_url,
    images: listing.images,
    finalImg: img
  });

  const arv = toNum(listing.arv);
  const repairs = toNum(listing.repairs);
  const spread = toNum(listing.spread);
  const roi = toNum(listing.roi);

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background: '#fff' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '160px 1fr',
          gap: 14,
          alignItems: 'center',
        }}
      >
        <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden', borderRadius: 10, background: '#f3f4f6' }}>
            {img ? (
              <Image 
                src={img} 
                alt="" 
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
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                No Image
              </div>
            )}
          </div>
        </Link>

        <div style={{ minWidth: 0 }}>
          <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{money(price)}</div>
            <div style={{ color: '#374151', fontSize: 13, marginTop: 4, lineHeight: 1.2 }}>{address || '—'}</div>
            <div style={{ color: '#111', fontSize: 13, marginTop: 8 }}>
              {beds !== undefined ? `${beds} bd` : '—'} • {baths !== undefined ? `${baths} ba` : '—'} •{' '}
              {sqft !== undefined ? `${sqft.toLocaleString()} sqft` : '—'}
            </div>
            
            {/* Additional details */}
            <div style={{ color: '#6b7280', fontSize: 12, marginTop: 6 }}>
              {lotSize && `Lot: ${lotSize.toLocaleString()} sqft`}
              {garage !== undefined && ` • Garage: ${garage ? 'Yes' : 'No'}`}
              {yearBuilt && ` • Built: ${yearBuilt}`}
            </div>

            {/* Description preview */}
            {description && (
              <div style={{ color: '#6b7280', fontSize: 12, marginTop: 6, lineHeight: 1.3, maxHeight: '2.6em', overflow: 'hidden' }}>
                {description.length > 100 ? `${description.substring(0, 100)}...` : description}
              </div>
            )}

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {arv !== undefined && (
                <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 16, background: '#E6FBF7', color: '#0f766e', border: '1px solid #A7F3D0' }}>
                  ARV {money(arv)}
                </span>
              )}
              {repairs !== undefined && (
                <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 16, background: '#E6FBF7', color: '#0f766e', border: '1px solid #A7F3D0' }}>
                  Repairs {money(repairs)}
                </span>
              )}
              {spread !== undefined && (
                <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 16, background: '#E6FBF7', color: '#0f766e', border: '1px solid #A7F3D0' }}>
                  Spread {money(spread)}
                </span>
              )}
              {roi !== undefined && (
                <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 16, background: '#E6FBF7', color: '#0f766e', border: '1px solid #A7F3D0' }}>
                  ROI {roi}%
                </span>
              )}
              {assignmentFee !== undefined && (
                <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 16, background: '#FEF3C7', color: '#92400e', border: '1px solid #FDE68A' }}>
                  Fee {money(assignmentFee)}
                </span>
              )}
            </div>

            {/* View button */}
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600 }}>View Details →</span>
            </div>
          </Link>

          {/* Contact buttons - OUTSIDE the Link to avoid nested <a> tags */}
          {(ownerPhone || ownerEmail) && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {ownerPhone && (
                <a href={`tel:${ownerPhone}`} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, background: '#10b981', color: 'white', textDecoration: 'none' }}>
                  📞 Call
                </a>
              )}
              {ownerPhone && (
                <a href={`sms:${ownerPhone}`} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, background: '#3b82f6', color: 'white', textDecoration: 'none' }}>
                  💬 Text
                </a>
              )}
              {ownerEmail && (
                <a href={`mailto:${ownerEmail}`} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, background: '#8b5cf6', color: 'white', textDecoration: 'none' }}>
                  ✉️ Email
                </a>
              )}
            </div>
          )}

          {/* Message Form */}
          {ownerEmail && (
            <MessageForm
              listingId={String(listing.id)}
              ownerEmail={ownerEmail}
              ownerPhone={ownerPhone}
              ownerName={listing.owner_name}
              listingTitle={listing.title}
            />
          )}
        </div>
      </div>
    </div>
  );
}