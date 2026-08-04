import type { LeadSource } from "@/lib/types";

// Fonte da verdade dos planos. Modelo de CRÉDITOS (fiel ao DS):
// 1 crédito = 1 contato novo entregue. Contato que já saiu numa busca
// anterior do usuário não é cobrado de novo (ver lib/usage.ts).
// Volumes de crédito são placeholders do DS até o cliente confirmar.

export type PlanId = "free" | "pro" | "business";

export type PlanLimits = {
  // Créditos por mês. Reseta virando o mês.
  creditsPerMonth: number;
  // Fontes liberadas.
  sources: LeadSource[];
  // Pode exportar CSV/Excel?
  exportCsv: boolean;
  // Dias de histórico de busca guardado. 0 = sem histórico.
  historyDays: number;
};

export type Plan = {
  id: PlanId;
  name: string;
  // Preço mensal em centavos de BRL. 0 = grátis.
  priceMonthlyCents: number;
  tagline: string;
  limits: PlanLimits;
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthlyCents: 0,
    tagline: "Pra experimentar e sentir o valor.",
    limits: {
      creditsPerMonth: 25,
      sources: ["places"],
      exportCsv: false,
      historyDays: 0,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthlyCents: 6700,
    tagline: "Pro dia a dia de quem prospecta.",
    limits: {
      creditsPerMonth: 2000,
      sources: ["places", "mercadolivre"],
      exportCsv: true,
      historyDays: 30,
    },
  },
  business: {
    id: "business",
    name: "Business",
    priceMonthlyCents: 14700,
    tagline: "Pra operação de outbound em volume.",
    limits: {
      creditsPerMonth: 10000,
      sources: ["places", "mercadolivre"],
      exportCsv: true,
      historyDays: 3650,
    },
  },
};

export const DEFAULT_PLAN: PlanId = "free";

export function getPlan(id: string | null | undefined): Plan {
  if (id && id in PLANS) return PLANS[id as PlanId];
  return PLANS[DEFAULT_PLAN];
}

export function priceLabel(cents: number): string {
  if (cents === 0) return "Grátis";
  return `R$ ${(cents / 100).toFixed(0)}`;
}

export function sourceAllowed(plan: Plan, source: LeadSource): boolean {
  return plan.limits.sources.includes(source);
}

export function nextPlan(id: PlanId): PlanId | null {
  if (id === "free") return "pro";
  if (id === "pro") return "business";
  return null;
}
