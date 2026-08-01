import { NextResponse } from "next/server";
import { isConnected } from "@/lib/mercadolivre";

export const runtime = "nodejs";

// Diz pra UI se ja existe token do ML salvo (loga o botao certo).
export async function GET() {
  return NextResponse.json({ connected: await isConnected() });
}
