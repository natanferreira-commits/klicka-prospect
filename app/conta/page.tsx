import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import { getUsage } from "@/lib/usage";
import { priceLabel } from "@/lib/plans";

export const metadata = { title: "Minha conta · Klicka Leads" };

export default async function ContaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/conta");

  const plan = user.plan;
  const usage = await getUsage(user.id);
  const pct = Math.min(
    100,
    Math.round((usage.searches / plan.limits.searchesPerMonth) * 100),
  );

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-900">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <Link href="/app" className="text-sm text-neutral-400 hover:text-neutral-100">
            ← Voltar pro app
          </Link>
          <form action="/auth/signout" method="post">
            <button className="text-sm text-neutral-500 hover:text-neutral-300">
              Sair
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold mb-1">Minha conta</h1>
        <p className="text-neutral-500 text-sm mb-8">{user.email}</p>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs text-neutral-500">Plano atual</span>
              <div className="text-xl font-semibold text-neutral-100">
                {plan.name}{" "}
                <span className="text-neutral-500 text-base font-normal">
                  · {priceLabel(plan.priceMonthlyCents)}
                  {plan.priceMonthlyCents > 0 ? "/mês" : ""}
                </span>
              </div>
            </div>
            {plan.id === "free" && (
              <Link
                href="/#precos"
                className="rounded-lg bg-purple-500 hover:bg-purple-400 text-white px-4 py-2 text-sm font-semibold transition-colors"
              >
                Fazer upgrade
              </Link>
            )}
          </div>
          <ul className="text-sm text-neutral-400 space-y-1">
            <li>• {plan.limits.searchesPerMonth} buscas por mês</li>
            <li>• Até {plan.limits.resultsPerSearch} resultados por busca</li>
            <li>• {plan.limits.exportCsv ? "Export CSV liberado" : "Sem export CSV"}</li>
          </ul>
        </div>

        {/* Consumo do mês */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-200">
              Buscas usadas este mês
            </span>
            <span className="text-sm text-neutral-400">
              {usage.searches} / {plan.limits.searchesPerMonth}
            </span>
          </div>
          <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${pct >= 100 ? "bg-amber-500" : "bg-purple-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-5 text-sm">
            <div>
              <div className="text-neutral-500 text-xs">Contatos extraídos</div>
              <div className="text-neutral-100 font-semibold">{usage.leads}</div>
            </div>
            <div>
              <div className="text-neutral-500 text-xs">Exports</div>
              <div className="text-neutral-100 font-semibold">{usage.exports}</div>
            </div>
          </div>
          <p className="text-xs text-neutral-600 mt-4">
            O contador zera no início de cada mês ({usage.period}).
          </p>
        </div>
      </div>
    </main>
  );
}
