// /app/types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Listing = {
  id: string;
  title: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  price: number | null;

  beds: number | null;
  baths: number | null;
  sqft: number | null;
  lot_size: number | null;

  description: string | null;
  contact_phone: string | null;
  contact_email: string | null;

  images: string[] | null;

  created_at: string | null;

  /** ownership */
  owner_id: string | null;     // <-- use this
  user_id?: string | null;     // optional legacy

  // alternates we read from
  bedrooms?: number | null;
  bathrooms?: number | null;
  square_feet?: number | null;
  [key: string]: any;
};
