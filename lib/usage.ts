import { db } from "@/lib/db";
import { usageCounters, usageEvents, deliveredContacts } from "@/lib/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { AppUser } from "@/lib/user";
import type { LeadSource } from "@/lib/types";
import { nextPlan, type PlanId } from "@/lib/plans";

// Periodo do contador: 'YYYY-MM' em UTC. Virar o mes = nova linha = reset.
export function currentPeriod(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type UsageSnapshot = {
  period: string;
  creditsUsed: number;
  searches: number;
  leads: number;
  exports: number;
};

export async function getUsage(userId: string): Promise<UsageSnapshot> {
  const period = currentPeriod();
  const rows = await db
    .select()
    .from(usageCounters)
    .where(and(eq(usageCounters.userId, userId), eq(usageCounters.period, period)))
    .limit(1);
  const r = rows[0];
  return {
    period,
    creditsUsed: r?.creditsUsed ?? 0,
    searches: r?.searchesCount ?? 0,
    leads: r?.leadsExtracted ?? 0,
    exports: r?.exportsCount ?? 0,
  };
}

// Contas internas/dono com crédito liberado. Os e-mails ficam em
// KLICKA_UNLIMITED_EMAILS (separados por vírgula), fora do código, porque o
// repo é público. Quem não está na lista segue o limite normal do plano.
const UNLIMITED_CREDITS = 1_000_000;

export function isUnlimited(user: AppUser): boolean {
  const raw = process.env.KLICKA_UNLIMITED_EMAILS ?? "";
  if (!raw.trim() || !user.email) return false;
  const list = raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.includes(user.email.toLowerCase());
}

export function creditsRemaining(user: AppUser, usage: UsageSnapshot): number {
  if (isUnlimited(user)) return UNLIMITED_CREDITS;
  return Math.max(0, user.plan.limits.creditsPerMonth - usage.creditsUsed);
}

async function bump(
  userId: string,
  field: "creditsUsed" | "searchesCount" | "leadsExtracted" | "exportsCount",
  by: number,
) {
  const period = currentPeriod();
  const values = { userId, period, [field]: by } as typeof usageCounters.$inferInsert;
  await db
    .insert(usageCounters)
    .values(values)
    .onConflictDoUpdate({
      target: [usageCounters.userId, usageCounters.period],
      set: { [field]: sql`${usageCounters[field]} + ${by}` },
    });
}

export type ChargeResult = {
  deliveredKeys: string[]; // contatos que o usuario pode ver (pagos agora + ja pagos antes)
  charged: number; // creditos gastos agora (contatos novos)
  reused: number; // contatos que ja eram dele (nao cobrados)
  blocked: number; // contatos novos que ficaram de fora por falta de credito
};

// Cobra os contatos NOVOS (nao entregues antes), respeitando o credito restante.
// Contato repetido nao cobra. Se faltar credito, entrega ate onde da.
export async function chargeForContacts(
  user: AppUser,
  contactKeys: string[],
  usage: UsageSnapshot,
): Promise<ChargeResult> {
  if (contactKeys.length === 0) {
    return { deliveredKeys: [], charged: 0, reused: 0, blocked: 0 };
  }

  // quais desses o usuario ja tem?
  const existing = await db
    .select({ k: deliveredContacts.contactKey })
    .from(deliveredContacts)
    .where(
      and(
        eq(deliveredContacts.userId, user.id),
        inArray(deliveredContacts.contactKey, contactKeys),
      ),
    );
  const alreadySet = new Set(existing.map((e) => e.k));
  const already = contactKeys.filter((k) => alreadySet.has(k));
  const fresh = contactKeys.filter((k) => !alreadySet.has(k));

  const remaining = creditsRemaining(user, usage);
  const affordable = fresh.slice(0, remaining);
  const blocked = fresh.length - affordable.length;

  if (affordable.length > 0) {
    const period = currentPeriod();
    await db
      .insert(deliveredContacts)
      .values(affordable.map((k) => ({ userId: user.id, contactKey: k, firstSeenPeriod: period })))
      .onConflictDoNothing();
    await bump(user.id, "creditsUsed", affordable.length);
  }

  return {
    deliveredKeys: [...already, ...affordable],
    charged: affordable.length,
    reused: already.length,
    blocked,
  };
}

// Estimativa heuristica de quantos negocios devem vir ANTES da busca.
// Adaptacao: o pre-count real do Google custa, entao aproximamos por
// porte da cidade x densidade do nicho x alcance. O numero real aparece
// depois da busca (o resultado corrige a estimativa).
const REACH_FACTOR: Record<string, number> = { cidade: 1, metro: 1.9, estado: 3.6 };
const BIG_CITIES = ["sao paulo", "rio de janeiro", "belo horizonte", "brasilia", "salvador", "fortaleza", "curitiba", "recife", "porto alegre", "manaus", "goiania", "campinas"];

function cityTier(region: string): number {
  const c = region.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(",")[0].trim();
  return BIG_CITIES.some((b) => c.includes(b)) ? 1.6 : 1;
}

export function estimateBusinesses(niche: string, region: string, reach = "cidade"): number {
  let h = 2166136261;
  const s = `${niche}|${region}`;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  const base = 14 + ((h >>> 0) % 13); // 14..26
  const n = base * (REACH_FACTOR[reach] ?? 1) * cityTier(region);
  return Math.round(n);
}

// Log (nao trava) — auditoria/custo. A trava e o credito.
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

export async function recordExport(user: AppUser, count: number): Promise<void> {
  await bump(user.id, "exportsCount", 1);
  await db.insert(usageEvents).values({
    userId: user.id,
    type: "export",
    quantity: count,
    meta: { plan: user.plan.id },
  });
}

export type LimitDenied = {
  ok: false;
  reason: string;
  upgrade: PlanId | null;
};

export function upgradeFor(user: AppUser): PlanId | null {
  return nextPlan(user.plan.id);
}
