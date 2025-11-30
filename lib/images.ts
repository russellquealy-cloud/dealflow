export function getFilesFromInput(input: HTMLInputElement): File[] {
  return Array.from(input.files ?? []);
}
export async function fileToDataUrl(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const b64 = Buffer.from(buf).toString('base64');
  return `data:${file.type};base64,${b64}`;
}
export async function uploadListingImage(file: File, path: string): Promise<{ url: string }> {
  // plug into your storage; return { url }
  return { url: path };
}
type Listingish = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const arrStr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

export function coverUrlFromListing(l: Listingish): string {
  return (
    str(l['cover_image_url']) ||
    str(l['cover_url']) ||
    str(l['hero_url']) ||
    str(l['image_url']) ||
    (arrStr(l['images'])[0] ?? '') ||
    (typeof l['image_urls'] === 'string'
      ? l['image_urls'].split(',').map((s) => s.trim()).filter(Boolean)[0] ?? ''
      : '')
  );
}

export function galleryFromListing(l: Listingish): string[] {
  // Try multiple possible field names for images
  const images = arrStr(l['images']) || arrStr(l['gallery']) || [];
  const fromCsv =
    typeof l['image_urls'] === 'string'
      ? l['image_urls'].split(',').map((s) => s.trim()).filter(Boolean)
      : [];
  
  // Combine all possible image sources
  const allImages = [...images, ...fromCsv].filter(Boolean);
  
  // Remove duplicates
  const uniqueImages = [...new Set(allImages)];
  
  return uniqueImages;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

export const SUPABASE_HOSTNAME = (() => {
  if (!SUPABASE_URL) return '';
  try {
    return new URL(SUPABASE_URL).hostname;
  } catch (error) {
    console.warn('images.ts: failed to parse NEXT_PUBLIC_SUPABASE_URL', error);
    return '';
  }
})();

export const SUPABASE_PUBLIC_BASE = SUPABASE_HOSTNAME ? `https://${SUPABASE_HOSTNAME}` : '';
export const SUPABASE_STORAGE_PUBLIC_BASE = SUPABASE_PUBLIC_BASE
  ? `${SUPABASE_PUBLIC_BASE}/storage/v1/object/public/`
  : '';

export const supabaseImageLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
  try {
    const url = new URL(src);
    url.searchParams.set('width', String(width));
    if (quality) {
      url.searchParams.set('quality', String(quality));
    }
    return url.toString();
  } catch {
    // If parsing fails (e.g. relative path), return original src
    return src;
  }
};

export const isSupabaseStorageUrl = (url?: string | null) => {
  if (!url || !SUPABASE_STORAGE_PUBLIC_BASE) return false;
  return url.startsWith(SUPABASE_STORAGE_PUBLIC_BASE);
};
