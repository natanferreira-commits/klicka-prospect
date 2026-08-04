import { db } from "@/lib/db";
import { usageCounters, usageEvents } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import type { AppUser } from "@/lib/user";
import type { LeadSource } from "@/lib/types";
import type { PlanId } from "@/lib/plans";

// Periodo do contador: 'YYYY-MM' em UTC. Virar o mes = nova linha = reset.
export function currentPeriod(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type UsageSnapshot = {
  period: string;
  searches: number;
  leads: number;
  exports: number;
};

export async function getUsage(userId: string): Promise<UsageSnapshot> {
  const period = currentPeriod();
  const rows = await db
    .select()
    .from(usageCounters)
    .where(
      and(eq(usageCounters.userId, userId), eq(usageCounters.period, period)),
    )
    .limit(1);
  const r = rows[0];
  return {
    period,
    searches: r?.searchesCount ?? 0,
    leads: r?.leadsExtracted ?? 0,
    exports: r?.exportsCount ?? 0,
  };
}

export type LimitDenied = {
  ok: false;
  reason: string;
  limit: number;
  used: number;
  upgrade: PlanId | null;
};
export type LimitCheck = { ok: true } | LimitDenied;

function nextPlan(id: PlanId): PlanId | null {
  if (id === "free") return "pro";
  if (id === "pro") return "business";
  return null;
}

// TRAVA principal: da pra fazer mais uma busca neste mes?
export async function checkSearchLimit(user: AppUser): Promise<LimitCheck> {
  const limit = user.plan.limits.searchesPerMonth;
  const usage = await getUsage(user.id);
  if (usage.searches >= limit) {
    return {
      ok: false,
      reason: `Você usou as ${limit} buscas do mês do plano ${user.plan.name}.`,
      limit,
      used: usage.searches,
      upgrade: nextPlan(user.plan.id),
    };
  }
  return { ok: true };
}

// Trava de enriquecimento (so morde no Free, que tem teto). Pago = ilimitado.
export async function checkEnrichLimit(user: AppUser): Promise<LimitCheck> {
  const cap = user.plan.limits.enrichPerMonth;
  if (cap == null) return { ok: true };
  const usage = await getUsage(user.id);
  if (usage.leads >= cap) {
    return {
      ok: false,
      reason: `Você atingiu o limite de ${cap} contatos extraídos do plano ${user.plan.name}.`,
      limit: cap,
      used: usage.leads,
      upgrade: nextPlan(user.plan.id),
    };
  }
  return { ok: true };
}

async function bump(
  userId: string,
  field: "searchesCount" | "leadsExtracted" | "exportsCount",
  by: number,
) {
  const period = currentPeriod();
  const insertValues: Record<string, unknown> = {
    userId,
    period,
    [field]: by,
  };
  await db
    .insert(usageCounters)
    .values(insertValues as typeof usageCounters.$inferInsert)
    .onConflictDoUpdate({
      target: [usageCounters.userId, usageCounters.period],
      set: { [field]: sql`${usageCounters[field]} + ${by}` },
    });
}

// Registra a acao no contador (trava) E no log append-only (auditoria/custo).
export async function recordSearch(
  user: AppUser,
  source: LeadSource,
  meta: Record<string, unknown>,
): Promise<void> {
  await bump(user.id, "searchesCount", 1);
  await db.insert(usageEvents).values({
    userId: user.id,
    type: "search",
    source,
    quantity: 1,
    meta: { ...meta, plan: user.plan.id },
  });
}

export async function recordEnrich(
  user: AppUser,
  source: LeadSource,
  count: number,
): Promise<void> {
  if (count <= 0) return;
  await bump(user.id, "leadsExtracted", count);
  await db.insert(usageEvents).values({
    userId: user.id,
    type: "enrich",
    source,
    quantity: count,
    meta: { plan: user.plan.id },
  });
}

export async function recordExport(
  user: AppUser,
  count: number,
): Promise<void> {
  await bump(user.id, "exportsCount", 1);
  await db.insert(usageEvents).values({
    userId: user.id,
    type: "export",
    quantity: count,
    meta: { plan: user.plan.id },
  });
}
