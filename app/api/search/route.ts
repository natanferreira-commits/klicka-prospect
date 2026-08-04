import { NextRequest, NextResponse } from "next/server";
import { searchPlaces } from "@/lib/places";
import { getCurrentUser } from "@/lib/user";
import {
  getUsage,
  creditsRemaining,
  chargeForContacts,
  recordSearch,
  upgradeFor,
} from "@/lib/usage";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "faça login" }, { status: 401 });
    }

    const { query } = (await req.json()) as { query?: string };
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    // sem crédito nenhum? nem roda.
    const usage = await getUsage(user.id);
    if (creditsRemaining(user, usage) <= 0) {
      return NextResponse.json(
        {
          error: `Seus ${user.plan.limits.creditsPerMonth} créditos do mês acabaram.`,
          limitReached: true,
          upgrade: upgradeFor(user),
        },
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

    // cobra por contato NOVO (repetido não cobra; corta no crédito restante)
    const charge = await chargeForContacts(user, results.map((r) => r.placeId), usage);
    const delivered = new Set(charge.deliveredKeys);
    const capped = results.filter((r) => delivered.has(r.placeId));

    await recordSearch(user, "places", { query: query.trim(), charged: charge.charged });

    return NextResponse.json({
      results: capped,
      totalFound,
      credits: { charged: charge.charged, reused: charge.reused, blocked: charge.blocked },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
