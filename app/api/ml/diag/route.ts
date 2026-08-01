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
  // como pegar o vendedor a partir de um produto do catalogo
  { name: "product_get", path: "/products/MLB34384408" },
  { name: "product_items", path: "/products/MLB34384408/items" },
  { name: "highlight_product_get", path: "/products/MLB29150924" },
  { name: "item_get", path: "/items/MLB34384408" },
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
        sample: body.slice(0, 600),
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
