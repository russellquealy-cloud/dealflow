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
