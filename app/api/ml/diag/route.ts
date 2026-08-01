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
  { name: "users_me", path: "/users/me" },
  { name: "search_q (bloqueado?)", path: "/sites/MLB/search?q=pet&limit=1" },
  { name: "search_category", path: "/sites/MLB/search?category=MLB1071&limit=1" },
  { name: "highlights_category", path: "/highlights/MLB/category/MLB1071" },
  { name: "trends_category", path: "/trends/MLB/MLB1071" },
  { name: "top_categories", path: "/sites/MLB/categories" },
  { name: "category_info", path: "/categories/MLB1071" },
  { name: "products_search", path: "/products/search?site_id=MLB&q=pet&limit=1" },
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
        sample: body.slice(0, 180),
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
