import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { exchangeCodeForTokens } from "@/lib/mercadolivre";
import { setTokens } from "@/lib/ml-tokens";

export const runtime = "nodejs";

// Confere a assinatura do state (prova que fomos nos que geramos).
function verifyState(state: string, secret: string): boolean {
  const dot = state.lastIndexOf(".");
  if (dot < 1) return false;
  const nonce = state.slice(0, dot);
  const sig = state.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(nonce).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Callback do OAuth: o ML redireciona pra ca com ?code=&state= . Valida a
// assinatura do state, troca o code pelos tokens e grava no cookie.
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

  const secret = process.env.ML_CLIENT_SECRET;
  if (!code) {
    home.searchParams.set("ml", "error");
    home.searchParams.set("ml_msg", "faltou code");
    return NextResponse.redirect(home);
  }
  if (!state || !secret || !verifyState(state, secret)) {
    home.searchParams.set("ml", "error");
    home.searchParams.set("ml_msg", "state invalido");
    return NextResponse.redirect(home);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    home.searchParams.set("ml", "connected");
    const res = NextResponse.redirect(home);
    setTokens(res, tokens);
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
