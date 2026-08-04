import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { getUsage, creditsRemaining, estimateBusinesses } from "@/lib/usage";

export const runtime = "nodejs";

// Estimativa pré-busca: quantos negócios devem vir + o saldo depois.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "faça login" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const niche = searchParams.get("niche") ?? "";
  const region = searchParams.get("region") ?? "";
  const reach = searchParams.get("reach") ?? "cidade";

  const estimate = niche && region ? estimateBusinesses(niche, region, reach) : 0;
  const usage = await getUsage(user.id);
  const remaining = creditsRemaining(user, usage);

  return NextResponse.json({
    estimate,
    remaining,
    after: Math.max(0, remaining - estimate),
    insufficient: estimate > remaining,
  });
}
