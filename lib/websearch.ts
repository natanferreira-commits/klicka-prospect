import * as cheerio from "cheerio";

// Busca web plugavel. Sem chave nenhuma cai no DuckDuckGo (bom pra testar
// o fluxo inteiro). Se ML_WEBSEARCH=google e as chaves do Google Custom
// Search estiverem no .env, usa o Google (mais estavel/volume).

export type WebResult = {
  title: string;
  url: string;
  snippet: string;
};

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const TIMEOUT_MS = 8000;

function withTimeout(): { signal: AbortSignal; done: () => void } {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return { signal: controller.signal, done: () => clearTimeout(id) };
}

async function duckduckgo(query: string): Promise<WebResult[]> {
  const { signal, done } = withTimeout();
  try {
    const res = await fetch("https://html.duckduckgo.com/html/", {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
      body: new URLSearchParams({ q: query, kl: "br-pt" }).toString(),
      signal,
    });
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const out: WebResult[] = [];
    $(".result__body").each((_, el) => {
      const a = $(el).find("a.result__a").first();
      const rawHref = a.attr("href") ?? "";
      const url = decodeDdgHref(rawHref);
      if (!url) return;
      out.push({
        title: a.text().trim(),
        url,
        snippet: $(el).find(".result__snippet").text().trim(),
      });
    });
    return out;
  } catch {
    return [];
  } finally {
    done();
  }
}

// DDG embrulha o link em //duckduckgo.com/l/?uddg=<encoded>
function decodeDdgHref(href: string): string | null {
  if (!href) return null;
  try {
    const u = new URL(href, "https://duckduckgo.com");
    if (u.pathname.startsWith("/l/")) {
      const target = u.searchParams.get("uddg");
      return target ? decodeURIComponent(target) : null;
    }
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
    return null;
  } catch {
    return null;
  }
}

async function googleCse(query: string): Promise<WebResult[]> {
  const key = process.env.GOOGLE_CSE_KEY;
  const cx = process.env.GOOGLE_CSE_CX;
  if (!key || !cx) return [];
  const { signal, done } = withTimeout();
  try {
    const params = new URLSearchParams({
      key,
      cx,
      q: query,
      num: "10",
      gl: "br",
      hl: "pt-BR",
    });
    const res = await fetch(
      `https://www.googleapis.com/customsearch/v1?${params.toString()}`,
      { signal },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      items?: { title?: string; link?: string; snippet?: string }[];
    };
    return (data.items ?? []).map((it) => ({
      title: it.title ?? "",
      url: it.link ?? "",
      snippet: it.snippet ?? "",
    }));
  } catch {
    return [];
  } finally {
    done();
  }
}

export async function searchWeb(query: string): Promise<WebResult[]> {
  const provider = (process.env.ML_WEBSEARCH ?? "duckduckgo").toLowerCase();
  if (provider === "google") {
    const g = await googleCse(query);
    if (g.length > 0) return g;
    // fallback pro DDG se o Google falhar/estourar cota
    return duckduckgo(query);
  }
  return duckduckgo(query);
}
