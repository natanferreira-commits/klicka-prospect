import { NextRequest, NextResponse } from "next/server";
import { searchPlaces } from "@/lib/places";
import { getCurrentUser } from "@/lib/user";
import { checkSearchLimit, recordSearch } from "@/lib/usage";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // 1) precisa estar logado
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "faça login" }, { status: 401 });
    }

    const { query } = (await req.json()) as { query?: string };
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    // 2) trava por busca (protege a margem: cada busca custa na Places API)
    const limit = await checkSearchLimit(user);
    if (!limit.ok) {
      return NextResponse.json(
        { error: limit.reason, limitReached: true, upgrade: limit.upgrade },
        { status: 402 },
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

    // 3) corta no limite de resultados do plano (Free 20, Pro/Business 60)
    const capped = results.slice(0, user.plan.limits.resultsPerSearch);

    // 4) registra: conta na trava + grava no log
    await recordSearch(user, "places", { query: query.trim() });

    return NextResponse.json({ results: capped, totalFound });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
