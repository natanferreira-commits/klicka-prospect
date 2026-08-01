import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { getAuthorizeUrl, MLAuthError } from "@/lib/mercadolivre";

export const runtime = "nodejs";

function base64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Inicia o fluxo OAuth: gera o par PKCE, guarda o verifier num cookie
// httpOnly e manda o usuario pro login do Mercado Livre.
export async function GET() {
  try {
    const codeVerifier = base64url(randomBytes(32));
    const codeChallenge = base64url(
      createHash("sha256").update(codeVerifier).digest(),
    );
    const state = base64url(randomBytes(16));

    const url = getAuthorizeUrl(codeChallenge, state);
    const res = NextResponse.redirect(url);

    const cookieOpts = {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 10, // 10 min pra concluir o login
    };
    res.cookies.set("ml_pkce_verifier", codeVerifier, cookieOpts);
    res.cookies.set("ml_oauth_state", state, cookieOpts);
    return res;
  } catch (err) {
    const msg = err instanceof MLAuthError ? err.message : "erro no authorize";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
