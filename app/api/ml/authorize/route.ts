import { NextResponse } from "next/server";
import { randomBytes, createHmac } from "crypto";
import { getAuthorizeUrl, MLAuthError } from "@/lib/mercadolivre";

export const runtime = "nodejs";

// Assina o nonce com o client_secret. Na volta a gente reconfere a
// assinatura, o que prova que fomos nos que geramos o state (protecao
// CSRF) sem depender de guardar nada em cookie.
function signState(nonce: string, secret: string): string {
  return createHmac("sha256", secret).update(nonce).digest("base64url");
}

// Inicia o fluxo OAuth: monta um state assinado e manda o usuario pro
// login do Mercado Livre.
export async function GET() {
  try {
    const secret = process.env.ML_CLIENT_SECRET;
    if (!secret) {
      throw new MLAuthError("ML_CLIENT_SECRET nao configurado");
    }
    const nonce = randomBytes(16).toString("base64url");
    const state = `${nonce}.${signState(nonce, secret)}`;
    return NextResponse.redirect(getAuthorizeUrl(state));
  } catch (err) {
    const msg = err instanceof MLAuthError ? err.message : "erro no authorize";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
