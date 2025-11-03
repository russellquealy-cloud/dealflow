import { NextResponse } from "next/server";
import { sendBasicTest } from "@/app/lib/email";

export const runtime = "nodejs";

export async function POST() {
  try {
    const result = await sendBasicTest();
    return NextResponse.json({ ok: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

