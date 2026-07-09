import { NextRequest, NextResponse } from "next/server";
import { autocompleteLocation } from "@/lib/places";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    const { input } = (await req.json()) as { input?: string };
    if (!input || typeof input !== "string" || input.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_MAPS_API_KEY not set on server" },
        { status: 500 },
      );
    }

    const suggestions = await autocompleteLocation(input.trim(), apiKey);
    return NextResponse.json({ suggestions });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
