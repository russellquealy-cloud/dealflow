
type Feature = {
  type: 'Feature';
  id: string;
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: Record<string, unknown>;
};
type FeatureCollection = { type: 'FeatureCollection'; features: Feature[] };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fc: FeatureCollection = { type: 'FeatureCollection', features: [] };
  // ...keep your existing logic, but ensure inserts to fc.features conform to Feature
  return Response.json(fc, { status: 200 });
}
