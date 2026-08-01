import type { MLTokens } from "./ml-tokens";

// Integracao com a API do Mercado Livre.
// A API de busca (sites/MLB/search) hoje exige token Bearer, e o ML so
// aceita os fluxos authorization_code e refresh_token (nada de
// client_credentials). Entao o fluxo e: login unico no navegador ->
// guarda refresh_token -> renova o access_token sozinho a cada busca.

const AUTH_BASE = "https://auth.mercadolivre.com.br/authorization";
const TOKEN_URL = "https://api.mercadolibre.com/oauth/token";
const API_BASE = "https://api.mercadolibre.com";
const SITE = "MLB"; // Brasil

// Erro tipado pra sinalizar que precisa refazer o login no ML.
export class MLAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MLAuthError";
  }
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new MLAuthError(`${name} nao configurado no .env.local`);
  return v;
}

// URL pra onde mandamos o usuario logar/autorizar o app.
export function getAuthorizeUrl(codeChallenge: string, state: string): string {
  const clientId = requireEnv("ML_CLIENT_ID");
  const redirectUri = requireEnv("ML_REDIRECT_URI");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });
  return `${AUTH_BASE}?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number; // segundos
};

async function postToken(body: Record<string, string>): Promise<MLTokens> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams(body).toString(),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new MLAuthError(`Token ${res.status}: ${txt.slice(0, 300)}`);
  }
  const data = (await res.json()) as TokenResponse;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    // renova 5 min antes de expirar, pra ter folga
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };
}

// Troca o code (recebido no callback) por access + refresh token.
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
): Promise<MLTokens> {
  return postToken({
    grant_type: "authorization_code",
    client_id: requireEnv("ML_CLIENT_ID"),
    client_secret: requireEnv("ML_CLIENT_SECRET"),
    code,
    redirect_uri: requireEnv("ML_REDIRECT_URI"),
    code_verifier: codeVerifier,
  });
}

// Renova usando o refresh_token. O ML rotaciona o refresh a cada uso,
// entao quem chamar precisa persistir o novo par.
async function refresh(refreshToken: string): Promise<MLTokens> {
  return postToken({
    grant_type: "refresh_token",
    client_id: requireEnv("ML_CLIENT_ID"),
    client_secret: requireEnv("ML_CLIENT_SECRET"),
    refresh_token: refreshToken,
  });
}

// Garante um access_token valido a partir dos tokens atuais. Se precisou
// renovar, devolve o novo par em `refreshed` pra rota gravar no cookie.
export async function ensureAccessToken(
  current: MLTokens,
): Promise<{ accessToken: string; refreshed: MLTokens | null }> {
  if (current.accessToken && Date.now() < current.expiresAt) {
    return { accessToken: current.accessToken, refreshed: null };
  }
  const renewed = await refresh(current.refreshToken);
  return { accessToken: renewed.accessToken, refreshed: renewed };
}

// ---------- Busca de lojas ----------

export type MLStore = {
  sellerId: number;
  nickname: string;
  reputation: string;
  city: string;
  state: string;
  permalink: string | null;
  // quantos anuncios dessa loja bateram com o nicho buscado
  matchedItems: number;
  totalSales: number | null;
};

type SearchItem = {
  seller?: { id?: number; nickname?: string };
  seller_id?: number;
};

type SearchResponse = {
  results?: SearchItem[];
  paging?: { total?: number };
};

type MLUser = {
  id: number;
  nickname?: string;
  permalink?: string;
  address?: { city?: string; state?: string };
  seller_reputation?: {
    level_id?: string | null;
    power_seller_status?: string | null;
    transactions?: { total?: number };
  };
};

async function apiGet<T>(pathWithQuery: string, accessToken: string): Promise<T> {
  const res = await fetch(`${API_BASE}${pathWithQuery}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  if (res.status === 401 || res.status === 403) {
    throw new MLAuthError(`API ${res.status}: token invalido ou sem permissao`);
  }
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`ML API ${res.status}: ${txt.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

function reputationLabel(rep: MLUser["seller_reputation"]): string {
  if (!rep) return "Sem reputacao";
  const power = rep.power_seller_status;
  if (power === "platinum") return "MercadoLider Platinum";
  if (power === "gold") return "MercadoLider Gold";
  if (power === "silver") return "MercadoLider";
  const level = rep.level_id ?? "";
  const map: Record<string, string> = {
    "5_green": "Verde (otima)",
    "4_light_green": "Verde claro",
    "3_yellow": "Amarelo",
    "2_orange": "Laranja",
    "1_red": "Vermelho",
  };
  return map[level] ?? "Novo vendedor";
}

// Busca lojas por nicho: pagina a busca, deduplica por seller e enriquece
// cada loja unica com dados do perfil (/users/{id}).
export async function searchSellers(
  query: string,
  accessToken: string,
  opts: { maxPages?: number; maxSellers?: number } = {},
): Promise<{ stores: MLStore[]; totalItems: number }> {
  const maxPages = opts.maxPages ?? 2;
  const maxSellers = opts.maxSellers ?? 30;
  const LIMIT = 50;

  const counts = new Map<number, number>();
  let totalItems = 0;

  for (let page = 0; page < maxPages; page++) {
    const offset = page * LIMIT;
    const q = encodeURIComponent(query);
    const data = await apiGet<SearchResponse>(
      `/sites/${SITE}/search?q=${q}&limit=${LIMIT}&offset=${offset}`,
      accessToken,
    );
    const items = data.results ?? [];
    if (page === 0) totalItems = data.paging?.total ?? items.length;
    for (const it of items) {
      const id = it.seller?.id ?? it.seller_id;
      if (typeof id === "number") {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
    if (items.length < LIMIT) break;
  }

  // ordena por quantidade de anuncios no nicho (loja mais relevante primeiro)
  const rankedIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxSellers)
    .map(([id]) => id);

  const stores: MLStore[] = [];
  // busca os perfis em pequenos lotes pra nao estourar rate limit
  const BATCH = 5;
  for (let i = 0; i < rankedIds.length; i += BATCH) {
    const batch = rankedIds.slice(i, i + BATCH);
    const users = await Promise.all(
      batch.map((id) =>
        apiGet<MLUser>(`/users/${id}`, accessToken).catch(() => null),
      ),
    );
    for (let j = 0; j < users.length; j++) {
      const u = users[j];
      const id = batch[j];
      if (!u) continue;
      stores.push({
        sellerId: id,
        nickname: u.nickname ?? `Loja ${id}`,
        reputation: reputationLabel(u.seller_reputation),
        city: u.address?.city ?? "",
        state: u.address?.state ?? "",
        permalink: u.permalink ?? null,
        matchedItems: counts.get(id) ?? 0,
        totalSales: u.seller_reputation?.transactions?.total ?? null,
      });
    }
  }

  return { stores, totalItems };
}
