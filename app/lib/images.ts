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
  const fromCsv =
    typeof l['image_urls'] === 'string'
      ? l['image_urls'].split(',').map((s) => s.trim()).filter(Boolean)
      : [];
  const base = arrStr(l['gallery']) || arrStr(l['images']) || fromCsv;
  const cover = coverUrlFromListing(l);
  return cover ? [cover, ...base.filter((u) => u && u !== cover)] : base;
}
