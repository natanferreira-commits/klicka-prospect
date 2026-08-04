import { NextRequest, NextResponse } from "next/server";
import {
  ensureAccessToken,
  searchSellers,
  MLAuthError,
  type MLStore,
} from "@/lib/mercadolivre";
import { readTokens, setTokens } from "@/lib/ml-tokens";
import type { SearchResult } from "@/lib/types";
import { getCurrentUser } from "@/lib/user";
import { sourceAllowed } from "@/lib/plans";
import {
  getUsage,
  creditsRemaining,
  chargeForContacts,
  recordSearch,
  upgradeFor,
} from "@/lib/usage";

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
    website: s.permalink,
    googleMapsUri: null,
  };
}

export async function POST(req: NextRequest) {
  try {
    // 0) precisa estar logado
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "faça login" }, { status: 401 });
    }

    const { query } = (await req.json()) as { query?: string };
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    // 0.1) fonte liberada no plano? (Free nao usa Mercado Livre)
    if (!sourceAllowed(user.plan, "mercadolivre")) {
      return NextResponse.json(
        {
          error: "O Mercado Livre está disponível a partir do plano Pro.",
          limitReached: true,
          upgrade: "pro",
        },
        { status: 402 },
      );
    }

    // 0.2) tem crédito?
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

    // 1) tem cookie de token?
    const current = readTokens(req);
    if (!current) {
      return NextResponse.json(
        { error: "Sem cookie de token no servidor", needsAuth: true },
        { status: 401 },
      );
    }

    // 2) consegue um access_token valido (renovando se preciso)?
    let accessToken: string;
    let refreshed;
    try {
      ({ accessToken, refreshed } = await ensureAccessToken(current));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "erro";
      return NextResponse.json(
        { error: `Falha ao renovar token: ${msg}`, needsAuth: true },
        { status: 401 },
      );
    }

    // 3) o ML aceita o token na busca?
    let stores: MLStore[];
    let totalItems: number;
    try {
      ({ stores, totalItems } = await searchSellers(query.trim(), accessToken));
    } catch (e) {
      if (e instanceof MLAuthError) {
        return NextResponse.json(
          { error: `ML recusou o token: ${e.message}`, needsAuth: true },
          { status: 401 },
        );
      }
      throw e;
    }

    const mapped = stores.map(storeToResult);
    const charge = await chargeForContacts(user, mapped.map((r) => r.placeId), usage);
    const delivered = new Set(charge.deliveredKeys);
    const results = mapped.filter((r) => delivered.has(r.placeId));

    await recordSearch(user, "mercadolivre", { query: query.trim(), charged: charge.charged });

    const res = NextResponse.json({
      results,
      totalFound: results.length,
      totalItems,
      credits: { charged: charge.charged, reused: charge.reused, blocked: charge.blocked },
    });
    if (refreshed) setTokens(res, refreshed);
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
