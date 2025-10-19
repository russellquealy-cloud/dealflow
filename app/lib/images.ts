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
