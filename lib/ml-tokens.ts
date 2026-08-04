import type { NextRequest, NextResponse } from "next/server";

// Token store em cookie seguro do navegador. Funciona em serverless (Vercel)
// sem precisar de banco/KV externo. Como o Klicka Leads e uso interno de
// um usuario so, guardar o token do ML no cookie httpOnly resolve: ele fica
// preso ao navegador onde voce logou e renova sozinho.

export type MLTokens = {
  accessToken: string;
  refreshToken: string;
  // epoch em ms de quando o access_token expira
  expiresAt: number;
};

const ACCESS_COOKIE = "ml_access";
const REFRESH_COOKIE = "ml_refresh";
const EXPIRES_COOKIE = "ml_expires";

const cookieOpts = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  // refresh token do ML dura ~6 meses
  maxAge: 60 * 60 * 24 * 180,
});

export function readTokens(req: NextRequest): MLTokens | null {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return null;
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value ?? "";
  const expiresRaw = req.cookies.get(EXPIRES_COOKIE)?.value;
  const expiresAt = expiresRaw ? Number.parseInt(expiresRaw, 10) || 0 : 0;
  return { accessToken, refreshToken, expiresAt };
}

export function setTokens(res: NextResponse, tokens: MLTokens): void {
  const opts = cookieOpts();
  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, opts);
  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, opts);
  res.cookies.set(EXPIRES_COOKIE, String(tokens.expiresAt), opts);
}

export function clearTokens(res: NextResponse): void {
  res.cookies.delete(ACCESS_COOKIE);
  res.cookies.delete(REFRESH_COOKIE);
  res.cookies.delete(EXPIRES_COOKIE);
}
