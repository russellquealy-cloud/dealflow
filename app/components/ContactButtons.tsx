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
        href={`/contact?listingId=${encodeURIComponent(id)}`}
        className="border rounded px-3 py-2 hover:bg-neutral-50"
      >
        Message Seller
      </Link>

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
    </div>
  );
}
