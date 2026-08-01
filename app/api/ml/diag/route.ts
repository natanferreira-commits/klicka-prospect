import { NextRequest, NextResponse } from "next/server";
import { ensureAccessToken } from "@/lib/mercadolivre";
import { readTokens, setTokens } from "@/lib/ml-tokens";

export const runtime = "nodejs";
export const maxDuration = 60;

// Diagnostico: bate em varios endpoints do ML com o token do usuario e
// devolve o status de cada um. Serve pra descobrir quais caminhos ainda
// estao liberados depois que o ML bloqueou o /sites/MLB/search.
// MLB1071 = categoria "Animais" (pet), so pra ter um alvo de teste.
const PROBES: { name: string; path: string }[] = [
  // vendedores de um produto ATIVO (mais vendido de pet)
  { name: "offers_active", path: "/products/MLB29150924/items" },
  { name: "offers_active_limit", path: "/products/MLB29150924/items?limit=10" },
  // busca no catalogo com mais resultados, pra ver os campos uteis
  { name: "products_search_full", path: "/products/search?site_id=MLB&q=racao%20cachorro&limit=3" },
];

export async function GET(req: NextRequest) {
  const current = readTokens(req);
  if (!current) {
    return NextResponse.json(
      { error: "Sem token. Conecte o Mercado Livre primeiro." },
      { status: 401 },
    );
  }

  let accessToken: string;
  let refreshed;
  try {
    ({ accessToken, refreshed } = await ensureAccessToken(current));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    return NextResponse.json({ error: `refresh falhou: ${msg}` }, { status: 401 });
  }

  const results = [];
  for (const probe of PROBES) {
    try {
      const r = await fetch(`https://api.mercadolibre.com${probe.path}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });
      const body = await r.text();
      results.push({
        name: probe.name,
        path: probe.path,
        status: r.status,
        ok: r.ok,
        sample: body.slice(0, 900),
      });
    } catch (e) {
      results.push({
        name: probe.name,
        path: probe.path,
        status: 0,
        ok: false,
        sample: e instanceof Error ? e.message : "fetch error",
      });
    }
  }

  const res = NextResponse.json({ results }, { status: 200 });
  if (refreshed) setTokens(res, refreshed);
  return res;
}
