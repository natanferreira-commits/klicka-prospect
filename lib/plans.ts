import type { LeadSource } from "@/lib/types";

// Fonte da verdade dos planos. Muda aqui e o resto do app (trava, UI, LP)
// reflete. Preco em centavos de BRL pra evitar float na cobranca (Fase 3).

export type PlanId = "free" | "pro" | "business";

export type PlanLimits = {
  // Trava principal: quantas buscas por mes. E o que custa pra gente (Places API).
  searchesPerMonth: number;
  // Quantos resultados o servidor devolve por busca (corta a lista aqui).
  resultsPerSearch: number;
  // Teto de leads enriquecidos no mes. null = ilimitado.
  enrichPerMonth: number | null;
  // Fontes liberadas.
  sources: LeadSource[];
  // Pode exportar CSV?
  exportCsv: boolean;
  // Dias de historico de busca guardado. 0 = sem historico.
  historyDays: number;
};

export type Plan = {
  id: PlanId;
  name: string;
  // Preco mensal em centavos de BRL. 0 = gratis.
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
      searchesPerMonth: 5,
      resultsPerSearch: 20,
      enrichPerMonth: 10,
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
      searchesPerMonth: 100,
      resultsPerSearch: 60,
      enrichPerMonth: null,
      sources: ["places", "mercadolivre"],
      exportCsv: true,
      historyDays: 30,
    },
  },
  business: {
    id: "business",
    name: "Business",
    priceMonthlyCents: 14700,
    tagline: "Pra operacao de outbound em volume.",
    limits: {
      searchesPerMonth: 400,
      resultsPerSearch: 60,
      enrichPerMonth: null,
      sources: ["places", "mercadolivre"],
      exportCsv: true,
      historyDays: 3650,
    },
  },
};

// Limite pro visitante anonimo experimentar no hero da LP (sem login).
// Busca real, mas travada por IP/dia e com resultado parcial + blur.
export const ANON_DEMO = {
  searchesPerDay: 1,
  resultsShown: 5,
  sources: ["places"] as LeadSource[],
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
