import { NextRequest, NextResponse } from "next/server";
import {
  getValidAccessToken,
  searchSellers,
  MLAuthError,
  type MLStore,
} from "@/lib/mercadolivre";
import type { SearchResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// Mapeia uma loja do ML pro mesmo shape que a UI ja usa (SearchResult),
// pra reaproveitar a tabela de resultados sem reescrever nada.
function storeToResult(s: MLStore): SearchResult {
  const local = [s.city, s.state].filter(Boolean).join("/");
  const sales = s.totalSales != null ? ` · ${s.totalSales} vendas` : "";
  return {
    placeId: `ml-${s.sellerId}`,
    name: s.nickname,
    category: s.reputation,
    address: `${local}${sales}`.trim(),
    rating: null,
    reviewCount: s.matchedItems,
    phone: null,
    // guardamos o link do perfil da loja como "site" so pra ter o clique;
    // o contato de verdade vem no enrich por busca web.
    website: s.permalink,
    googleMapsUri: null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { query } = (await req.json()) as { query?: string };
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const accessToken = await getValidAccessToken();
    const { stores, totalItems } = await searchSellers(
      query.trim(),
      accessToken,
    );
    const results = stores.map(storeToResult);
    return NextResponse.json({ results, totalFound: results.length, totalItems });
  } catch (err) {
    if (err instanceof MLAuthError) {
      return NextResponse.json(
        { error: err.message, needsAuth: true },
        { status: 401 },
      );
    }
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
