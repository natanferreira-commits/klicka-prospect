import { searchWeb, type WebResult } from "./websearch";
import { enrichOne } from "./scraper";
import {
  classifyUrl,
  extractInstagramHandleFromUrl,
  extractPhoneFromWaLink,
} from "./url-classifier";
import type { EnrichmentResult } from "./types";

// Dominios que nao sao o "site proprio" da loja (marketplaces, buscadores).
// Ainda aproveitamos instagram/whatsapp que aparecerem, mas nao contam como
// site oficial pra raspar.
const NOT_OWN_SITE = new Set([
  "mercadolivre.com.br",
  "mercadolibre.com",
  "produto.mercadolivre.com.br",
  "lista.mercadolivre.com.br",
  "amazon.com.br",
  "magazineluiza.com.br",
  "magazinevoce.com.br",
  "americanas.com.br",
  "casasbahia.com.br",
  "shopee.com.br",
  "olx.com.br",
  "elo7.com.br",
  "enjoei.com.br",
  "reclameaqui.com.br",
  "google.com",
  "duckduckgo.com",
  "youtube.com",
]);

function host(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

// A partir dos resultados de busca, separa o melhor site proprio e os
// perfis sociais / whatsapp que aparecerem.
function pickCandidates(results: WebResult[]): {
  website: string | null;
  instagram: string | null;
  whatsapp: string | null;
} {
  let website: string | null = null;
  let instagram: string | null = null;
  let whatsapp: string | null = null;

  for (const r of results) {
    const { kind, normalized } = classifyUrl(r.url);
    if (!normalized) continue;
    const h = host(r.url);

    if (kind === "instagram" && !instagram) {
      instagram = extractInstagramHandleFromUrl(normalized);
    } else if (kind === "wa_link" && !whatsapp) {
      whatsapp = extractPhoneFromWaLink(normalized);
    } else if (kind === "website" && !website && !NOT_OWN_SITE.has(h)) {
      website = r.url;
    }
  }
  return { website, instagram, whatsapp };
}

// Acha contato de uma loja do ML pelo nome: busca na web, escolhe o melhor
// site/social e, se tiver site proprio, raspa email/whatsapp/instagram dele.
export async function findContactForStore(
  placeId: string,
  storeName: string,
): Promise<EnrichmentResult> {
  const results = await searchWeb(`${storeName} contato`);

  if (results.length === 0) {
    return {
      placeId,
      email: null,
      whatsapp: null,
      instagram: null,
      website: null,
      scrapeStatus: "empty",
    };
  }

  const cand = pickCandidates(results);

  // Se achou site proprio, raspa ele reaproveitando o scraper existente.
  if (cand.website) {
    const scraped = await enrichOne(placeId, cand.website);
    return {
      placeId,
      email: scraped.email,
      whatsapp: scraped.whatsapp ?? cand.whatsapp,
      instagram: scraped.instagram ?? cand.instagram,
      website: cand.website,
      scrapeStatus:
        scraped.email || scraped.whatsapp || scraped.instagram || cand.instagram
          ? "ok"
          : scraped.scrapeStatus,
    };
  }

  // Sem site proprio: fica com o que a busca revelou (insta / whatsapp).
  const anySocial = cand.instagram || cand.whatsapp;
  return {
    placeId,
    email: null,
    whatsapp: cand.whatsapp,
    instagram: cand.instagram,
    website: null,
    scrapeStatus: anySocial ? "ok" : "empty",
  };
}
