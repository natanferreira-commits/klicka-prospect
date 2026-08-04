import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import { getUsage, creditsRemaining } from "@/lib/usage";
import { priceLabel } from "@/lib/plans";

export const metadata = { title: "Conta · klicka." };

export default async function ContaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/conta");

  const plan = user.plan;
  const usage = await getUsage(user.id);
  const remaining = creditsRemaining(user, usage);
  const pct = Math.min(100, Math.round((usage.creditsUsed / plan.limits.creditsPerMonth) * 100));

  return (
    <main style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <header style={{ borderBottom: "1px solid var(--color-divider)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/app" style={{ color: "var(--color-neutral-300)", textDecoration: "none", fontSize: 14 }}>← Voltar pro app</Link>
          <form action="/auth/signout" method="post">
            <button className="btn btn-ghost" style={{ fontSize: 13 }}>Sair</button>
          </form>
        </div>
      </header>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "56px 32px" }}>
        <Image src="/klicka-logo.png" alt="klicka." width={82} height={20} style={{ height: 20, width: "auto", marginBottom: 28 }} />
        <h1 style={{ marginBottom: 4 }}>Conta</h1>
        <p className="text-muted" style={{ fontSize: 14, marginBottom: 32 }}>{user.email}</p>

        {/* Plano */}
        <div className="card elev-sm" style={{ padding: "var(--space-8)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div className="card-kicker">Plano atual</div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, marginTop: 4 }}>
                {plan.name} <span className="text-muted" style={{ fontSize: 15 }}>· {priceLabel(plan.priceMonthlyCents)}{plan.priceMonthlyCents > 0 ? "/mês" : ""}</span>
              </div>
            </div>
            {plan.id !== "business" && (
              <Link className="btn btn-primary" href="/#planos">Fazer upgrade</Link>
            )}
          </div>
        </div>

        {/* Créditos do mês */}
        <div className="card elev-sm" style={{ padding: "var(--space-8)", marginTop: "var(--space-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontFamily: "var(--font-heading)" }}>Créditos usados este mês</span>
            <span className="text-muted" style={{ fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
              {usage.creditsUsed.toLocaleString("pt-BR")} / {plan.limits.creditsPerMonth.toLocaleString("pt-BR")}
            </span>
          </div>
          <div style={{ height: 3, borderRadius: 2, background: "var(--color-neutral-800)", overflow: "hidden" }}>
            <div style={{ height: 3, width: `${pct}%`, borderRadius: 2, background: "var(--color-accent)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
            <div>
              <div className="text-muted" style={{ fontSize: 11 }}>Créditos restantes</div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, letterSpacing: "-0.02em", color: "var(--color-accent)", fontVariantNumeric: "tabular-nums" }}>{remaining.toLocaleString("pt-BR")}</div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: 11 }}>Contatos entregues</div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{usage.creditsUsed.toLocaleString("pt-BR")}</div>
            </div>
          </div>
          <p className="text-muted" style={{ fontSize: 12, marginTop: 16 }}>
            1 crédito = 1 contato novo. Contato repetido não cobra de novo. Zera no início de cada mês ({usage.period}).
          </p>
        </div>
      </div>
    </main>
  );
}
