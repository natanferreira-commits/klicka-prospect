import { NextRequest, NextResponse } from "next/server";
import { searchPlaces } from "@/lib/places";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { query } = (await req.json()) as { query?: string };
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "query is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_MAPS_API_KEY not set on server" },
        { status: 500 },
      );
    }

    const { results, totalFound } = await searchPlaces(query.trim(), apiKey);
    return NextResponse.json({ results, totalFound });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
