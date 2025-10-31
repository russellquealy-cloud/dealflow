'use client';

import * as React from 'react';
import Link from 'next/link';

type Props = {
  listingId: string | number;
  email?: string;     // optional seller email if you have it
  phone?: string;     // optional seller phone if you have it
};

export default function ContactButtons({ listingId, email, phone }: Props) {
  const id = String(listingId);

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Link
        href={`/messages/${encodeURIComponent(id)}`}
        className="border rounded px-3 py-2 hover:bg-neutral-50"
        style={{
          display: 'inline-block',
          padding: '8px 16px',
          border: '1px solid #3b82f6',
          borderRadius: 6,
          background: '#3b82f6',
          color: '#fff',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: 14
        }}
      >
        💬 Message Seller
      </Link>

      {/* Email and Phone are now hidden - all communication goes through internal messaging */}
      {/* Keeping them hidden but available if needed for future feature */}
      {false && (
        <>
          <a
            href={email ? `mailto:${email}?subject=Inquiry about listing ${id}` : '#'}
            className="border rounded px-3 py-2 hover:bg-neutral-50"
            aria-disabled={!email}
            onClick={(e) => { if (!email) e.preventDefault(); }}
          >
            Email
          </a>

          <a
            href={phone ? `tel:${phone}` : '#'}
            className="border rounded px-3 py-2 hover:bg-neutral-50"
            aria-disabled={!phone}
            onClick={(e) => { if (!phone) e.preventDefault(); }}
          >
            Call / Text
          </a>
        </>
      )}
    </div>
  );
}
