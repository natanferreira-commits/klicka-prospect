import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { recordExport } from "@/lib/usage";

export const runtime = "nodejs";

// Registra um export de CSV. Free nao exporta (gate no servidor + na UI).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "faça login" }, { status: 401 });
  }
  if (!user.plan.limits.exportCsv) {
    return NextResponse.json(
      {
        error: "Export de CSV é a partir do plano Pro.",
        limitReached: true,
        upgrade: "pro",
      },
      { status: 402 },
    );
  }
  const { count } = (await req.json().catch(() => ({}))) as { count?: number };
  await recordExport(user, count ?? 0);
  return NextResponse.json({ ok: true });
}
