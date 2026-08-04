import Link from "next/link";
import HeroSearch from "@/components/HeroSearch";
import { createClient } from "@/lib/supabase/server";
import { PLANS, priceLabel, type Plan } from "@/lib/plans";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Nav */}
      <nav className="border-b border-neutral-900">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight">
            Klicka<span className="text-purple-400">Leads</span>
          </span>
          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <Link
                href="/app"
                className="rounded-lg bg-purple-500 hover:bg-purple-400 text-white px-4 py-2 font-semibold transition-colors"
              >
                Ir pro app →
              </Link>
            ) : (
              <>
                <Link
                  href="/entrar"
                  className="text-neutral-400 hover:text-neutral-100 transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastrar"
                  className="rounded-lg bg-purple-500 hover:bg-purple-400 text-white px-4 py-2 font-semibold transition-colors"
                >
                  Criar grátis
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
        <span className="inline-block text-xs font-medium text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1 mb-6">
          Prospecção B2B em segundos
        </span>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05] mb-5">
          Ache clientes.
          <br />
          <span className="text-purple-400">Extraia os contatos.</span>
        </h1>
        <p className="text-neutral-400 text-lg max-w-2xl mx-auto mb-10">
          Busque qualquer nicho numa cidade e receba uma lista de empresas com
          telefone, WhatsApp, email e Instagram — pronta pra exportar e prospectar.
        </p>
        <HeroSearch />
      </section>

      {/* Como funciona */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              n: "1",
              t: "Busque o nicho",
              d: "Ex: “Dentistas em Niterói”. O motor varre o Google Maps e o Mercado Livre.",
            },
            {
              n: "2",
              t: "Extraia os contatos",
              d: "A gente raspa os sites e acha telefone, WhatsApp, email e Instagram automaticamente.",
            },
            {
              n: "3",
              t: "Exporte e prospecte",
              d: "Baixe em CSV pronto pra subir na sua ferramenta de outbound ou disparo.",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-500/15 text-purple-300 font-bold flex items-center justify-center mb-4">
                {s.n}
              </div>
              <h3 className="font-semibold text-neutral-100 mb-1.5">{s.t}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Preços */}
      <section id="precos" className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-2">Planos simples</h2>
        <p className="text-neutral-400 text-center mb-10">
          Comece grátis. Suba de plano quando precisar de volume.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.values(PLANS) as Plan[]).map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl border p-6 flex flex-col ${
                plan.id === "pro"
                  ? "border-purple-500/50 bg-purple-500/[0.04]"
                  : "border-neutral-800 bg-neutral-900/40"
              }`}
            >
              {plan.id === "pro" && (
                <span className="text-xs font-semibold text-purple-300 mb-2">
                  MAIS POPULAR
                </span>
              )}
              <h3 className="text-lg font-semibold text-neutral-100">
                {plan.name}
              </h3>
              <p className="text-sm text-neutral-500 mb-4">{plan.tagline}</p>
              <div className="mb-5">
                <span className="text-3xl font-extrabold">
                  {priceLabel(plan.priceMonthlyCents)}
                </span>
                {plan.priceMonthlyCents > 0 && (
                  <span className="text-neutral-500 text-sm">/mês</span>
                )}
              </div>
              <ul className="space-y-2 text-sm text-neutral-300 flex-1">
                <li>✓ {plan.limits.searchesPerMonth} buscas/mês</li>
                <li>✓ Até {plan.limits.resultsPerSearch} resultados/busca</li>
                <li>
                  ✓{" "}
                  {plan.limits.sources.length > 1
                    ? "Google Maps + Mercado Livre"
                    : "Google Maps"}
                </li>
                <li className={plan.limits.exportCsv ? "" : "text-neutral-600"}>
                  {plan.limits.exportCsv ? "✓ Export CSV" : "✗ Export CSV"}
                </li>
                <li className={plan.limits.historyDays ? "" : "text-neutral-600"}>
                  {plan.limits.historyDays
                    ? "✓ Histórico de buscas"
                    : "✗ Sem histórico"}
                </li>
              </ul>
              <Link
                href="/cadastrar"
                className={`mt-6 rounded-lg px-4 py-2.5 text-center font-semibold text-sm transition-colors ${
                  plan.id === "pro"
                    ? "bg-purple-500 hover:bg-purple-400 text-white"
                    : "border border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                }`}
              >
                {plan.priceMonthlyCents === 0 ? "Começar grátis" : "Assinar"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-900 mt-8">
        <div className="mx-auto max-w-6xl px-6 py-8 flex items-center justify-between text-sm text-neutral-500">
          <span>
            Klicka<span className="text-purple-400">Leads</span>
          </span>
          <span>© {new Date().getFullYear()} Grupo Dupla</span>
        </div>
      </footer>
    </div>
  );
}
