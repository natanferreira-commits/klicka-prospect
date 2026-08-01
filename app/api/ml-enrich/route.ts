import { NextRequest, NextResponse } from "next/server";
import { findContactForStore } from "@/lib/contact-finder";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_ITEMS_PER_REQUEST = 10;

type MLEnrichItem = { placeId: string; name: string };

// Enrich das lojas do ML: acha contato de cada uma por busca web.
// Roda sequencial (nao em paralelo) pra ser gentil com o motor de busca
// gratuito e nao tomar bloqueio por rajada.
export async function POST(req: NextRequest) {
  try {
    const { items } = (await req.json()) as { items?: MLEnrichItem[] };
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

    const results = [];
    for (const it of items) {
      results.push(await findContactForStore(it.placeId, it.name));
    }
    return NextResponse.json({ results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
