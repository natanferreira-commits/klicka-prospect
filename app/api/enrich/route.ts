import { NextRequest, NextResponse } from "next/server";
import { enrichOne } from "@/lib/scraper";
import { getCurrentUser } from "@/lib/user";
import { checkEnrichLimit, recordEnrich } from "@/lib/usage";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_ITEMS_PER_REQUEST = 15;

type EnrichPayloadItem = { placeId: string; website: string | null };

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "faça login" }, { status: 401 });
    }

    const { items } = (await req.json()) as { items?: EnrichPayloadItem[] };
    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "items array required" },
        { status: 400 },
      );
    }
    if (items.length > MAX_ITEMS_PER_REQUEST) {
      return NextResponse.json(
        { error: `max ${MAX_ITEMS_PER_REQUEST} items per request` },
        { status: 400 },
      );
    }

    // teto de contatos (so morde no Free)
    const limit = await checkEnrichLimit(user);
    if (!limit.ok) {
      return NextResponse.json(
        { error: limit.reason, limitReached: true, upgrade: limit.upgrade },
        { status: 402 },
      );
    }

    const results = await Promise.all(
      items.map((it) => enrichOne(it.placeId, it.website)),
    );
    await recordEnrich(user, "places", results.length);
    return NextResponse.json({ results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
