import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { getUsage, creditsRemaining } from "@/lib/usage";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }
  const usage = await getUsage(user.id);
  return NextResponse.json({
    email: user.email,
    plan: {
      id: user.plan.id,
      name: user.plan.name,
      limits: user.plan.limits,
    },
    credits: {
      used: usage.creditsUsed,
      limit: user.plan.limits.creditsPerMonth,
      remaining: creditsRemaining(user, usage),
    },
    usage,
  });
}
