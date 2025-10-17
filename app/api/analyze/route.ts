import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { price, arv, repairs, sqft, lot_sqft } = body ?? {};
    const spread = Math.max(0, (arv ?? 0) - (repairs ?? 0) - (price ?? 0));
    const roi = price ? Math.round((spread / price) * 100) : 0;

    // place for LLM later; for now deterministic “analysis”
    return NextResponse.json({
      spread,
      roi,
      notes: [
        spread > 0 ? 'Deal has positive spread.' : 'No positive spread.',
        sqft ? `Price/sqft: $${Math.round((price ?? 0) / sqft)}` : null,
        lot_sqft ? `Lot: ${Number(lot_sqft).toLocaleString()} sqft` : null,
      ].filter(Boolean),
    });
  } catch (e) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
