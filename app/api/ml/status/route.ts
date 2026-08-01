import { NextRequest, NextResponse } from "next/server";
import { readTokens } from "@/lib/ml-tokens";

export const runtime = "nodejs";

// Diz pra UI se ja existe token do ML no cookie (loga o botao certo).
export async function GET(req: NextRequest) {
  return NextResponse.json({ connected: readTokens(req) !== null });
}
