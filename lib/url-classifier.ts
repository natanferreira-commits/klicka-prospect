export type UrlKind =
  | "wa_link"
  | "instagram"
  | "facebook"
  | "linktree"
  | "biolink"
  | "beacons"
  | "website"
  | "invalid";

export function classifyUrl(url: string): {
  kind: UrlKind;
  normalized: URL | null;
} {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { kind: "invalid", normalized: null };
  }
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "wa.me" || host === "api.whatsapp.com")
    return { kind: "wa_link", normalized: u };
  if (host === "instagram.com")
    return { kind: "instagram", normalized: u };
  if (host === "facebook.com" || host === "fb.com" || host === "m.facebook.com")
    return { kind: "facebook", normalized: u };
  if (host === "linktr.ee") return { kind: "linktree", normalized: u };
  if (host === "bio.link") return { kind: "biolink", normalized: u };
  if (host === "beacons.ai") return { kind: "beacons", normalized: u };
  return { kind: "website", normalized: u };
}

export function extractPhoneFromWaLink(url: URL): string | null {
  if (url.hostname === "wa.me") {
    const raw = url.pathname.replace(/[^0-9]/g, "");
    return raw.length >= 10 ? "+" + raw : null;
  }
  if (url.hostname === "api.whatsapp.com") {
    const phone = url.searchParams.get("phone");
    if (phone) {
      const raw = phone.replace(/[^0-9]/g, "");
      return raw.length >= 10 ? "+" + raw : null;
    }
  }
  return null;
}

export function extractInstagramHandleFromUrl(url: URL): string | null {
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  const first = segments[0];
  if (["p", "reel", "reels", "explore", "stories", "tv"].includes(first))
    return null;
  return "@" + first;
}
