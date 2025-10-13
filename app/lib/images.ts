// /app/lib/images.ts
import { supabase } from "@/lib/supabaseClient";

const BUCKET = process.env.NEXT_PUBLIC_LISTING_IMAGES_BUCKET;

/** Accepts either a full URL or a Supabase Storage path; returns a public URL. */
export function imageUrl(pathOrUrl?: string | null): string | undefined {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;        // already a URL
  if (!BUCKET) return pathOrUrl;                                 // no bucket set -> return as-is
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(pathOrUrl);
  return data?.publicUrl ?? pathOrUrl;
}

/** Pick a cover image from common listing fields and make it public. */
export function coverUrlFromListing(listing: any): string | undefined {
  const arr = (listing?.images ?? listing?.photo_urls ?? listing?.photos) as string[] | undefined;
  const first = Array.isArray(arr) && arr.length > 0
    ? arr[0]
    : (listing?.image_url ?? listing?.cover_image ?? listing?.main_image ?? listing?.photo);
  return imageUrl(first);
}

/** Build a gallery (public URLs) from common image array fields. */
export function galleryFromListing(listing: any): string[] {
  const arr = (listing?.images ?? listing?.photo_urls ?? listing?.photos) as string[] | undefined;
  if (!Array.isArray(arr)) return [];
  return arr.map((p) => imageUrl(p)).filter(Boolean) as string[];
}
