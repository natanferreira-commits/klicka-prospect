import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/mercadolivre";

export const runtime = "nodejs";

// Callback do OAuth: o ML redireciona pra ca com ?code=... . A gente valida
// o state, troca o code pelos tokens (usando o verifier do cookie) e volta
// pra home sinalizando o resultado.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const home = new URL("/", req.url);

  if (error) {
    home.searchParams.set("ml", "error");
    home.searchParams.set("ml_msg", error);
    return NextResponse.redirect(home);
  }

  const verifier = req.cookies.get("ml_pkce_verifier")?.value;
  const savedState = req.cookies.get("ml_oauth_state")?.value;

  if (!code || !verifier) {
    home.searchParams.set("ml", "error");
    home.searchParams.set("ml_msg", "faltou code ou verifier");
    return NextResponse.redirect(home);
  }
  if (!state || !savedState || state !== savedState) {
    home.searchParams.set("ml", "error");
    home.searchParams.set("ml_msg", "state invalido");
    return NextResponse.redirect(home);
  }

  try {
    await exchangeCodeForTokens(code, verifier);
    home.searchParams.set("ml", "connected");
    const res = NextResponse.redirect(home);
    // limpa os cookies temporarios do fluxo
    res.cookies.delete("ml_pkce_verifier");
    res.cookies.delete("ml_oauth_state");
    return res;
  } catch (err) {
    home.searchParams.set("ml", "error");
    home.searchParams.set(
      "ml_msg",
      err instanceof Error ? err.message : "erro na troca de token",
    );
    return NextResponse.redirect(home);
  }
}
