import * as cheerio from "cheerio";
import {
  classifyUrl,
  extractInstagramHandleFromUrl,
  extractPhoneFromWaLink,
} from "./url-classifier";
import type { EnrichmentResult } from "./types";

const USER_AGENT =
  "Mozilla/5.0 (compatible; KlickaProspectBot/0.1; contact@klicka.local)";
const FETCH_TIMEOUT_MS = 5000;

const EMAIL_DOMAIN_BLOCKLIST = new Set([
  "wordpress.com",
  "wixpress.com",
  "wix.com",
  "elementor.com",
  "sentry.io",
  "godaddy.com",
  "example.com",
  "domain.com",
  "email.com",
  "yourwebsite.com",
]);

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export async function enrichOne(
  placeId: string,
  website: string | null,
): Promise<EnrichmentResult> {
  if (!website) {
    return {
      placeId,
      email: null,
      whatsapp: null,
      instagram: null,
      scrapeStatus: "no_website",
    };
  }

  const { kind, normalized } = classifyUrl(website);
  if (!normalized) {
    return {
      placeId,
      email: null,
      whatsapp: null,
      instagram: null,
      scrapeStatus: "no_website",
    };
  }

  if (kind === "wa_link") {
    const phone = extractPhoneFromWaLink(normalized);
    return {
      placeId,
      email: null,
      whatsapp: phone,
      instagram: null,
      scrapeStatus: phone ? "ok" : "empty",
    };
  }
  if (kind === "instagram") {
    const handle = extractInstagramHandleFromUrl(normalized);
    return {
      placeId,
      email: null,
      whatsapp: null,
      instagram: handle,
      scrapeStatus: handle ? "ok" : "empty",
    };
  }
  if (kind === "facebook") {
    return {
      placeId,
      email: null,
      whatsapp: null,
      instagram: null,
      scrapeStatus: "empty",
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let html: string;
    try {
      const res = await fetch(normalized.toString(), {
        headers: {
          "User-Agent": USER_AGENT,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        },
        signal: controller.signal,
        redirect: "follow",
      });
      if (!res.ok) {
        return {
          placeId,
          email: null,
          whatsapp: null,
          instagram: null,
          scrapeStatus: "parse_failed",
        };
      }
      html = await res.text();
    } finally {
      clearTimeout(timeoutId);
    }

    const $ = cheerio.load(html);
    const email = extractEmail($, html);
    const whatsapp = extractWhatsApp($);
    const instagram = extractInstagram($);
    const anyFound = email || whatsapp || instagram;

    return {
      placeId,
      email,
      whatsapp,
      instagram,
      scrapeStatus: anyFound ? "ok" : "empty",
    };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    return {
      placeId,
      email: null,
      whatsapp: null,
      instagram: null,
      scrapeStatus: isAbort ? "timeout" : "parse_failed",
    };
  }
}

function extractEmail(
  $: cheerio.CheerioAPI,
  html: string,
): string | null {
  const candidates = new Set<string>();

  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const raw = href.replace(/^mailto:/i, "").split("?")[0].trim();
    if (raw.includes("@")) candidates.add(raw.toLowerCase());
  });

  const matches = html.match(EMAIL_REGEX) ?? [];
  for (const m of matches) candidates.add(m.toLowerCase());

  for (const email of candidates) {
    const domain = email.split("@")[1];
    if (!domain) continue;
    if (EMAIL_DOMAIN_BLOCKLIST.has(domain)) continue;
    if (/\.(png|jpg|jpeg|svg|gif|webp)$/.test(domain)) continue;
    return email;
  }
  return null;
}

function extractWhatsApp($: cheerio.CheerioAPI): string | null {
  const hrefs: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (href) hrefs.push(href);
  });
  for (const href of hrefs) {
    const lower = href.toLowerCase();
    if (lower.includes("wa.me/")) {
      const match = lower.match(/wa\.me\/(\+?\d+)/);
      if (match) return "+" + match[1].replace(/[^0-9]/g, "");
    }
    if (lower.includes("api.whatsapp.com/send")) {
      try {
        const u = new URL(href, "https://dummy.local/");
        const phone = u.searchParams.get("phone");
        if (phone) return "+" + phone.replace(/[^0-9]/g, "");
      } catch {
        // ignore
      }
    }
    if (lower.startsWith("whatsapp://send")) {
      const match = lower.match(/phone=(\+?\d+)/);
      if (match) return "+" + match[1].replace(/[^0-9]/g, "");
    }
  }
  return null;
}

function extractInstagram($: cheerio.CheerioAPI): string | null {
  const hrefs: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (href) hrefs.push(href);
  });
  for (const href of hrefs) {
    if (!href.includes("instagram.com/")) continue;
    try {
      const u = new URL(href, "https://dummy.local/");
      const segments = u.pathname.split("/").filter(Boolean);
      if (segments.length === 0) continue;
      const first = segments[0];
      if (
        ["p", "reel", "reels", "explore", "stories", "tv"].includes(first)
      )
        continue;
      return "@" + first;
    } catch {
      // ignore
    }
  }
  return null;
}
