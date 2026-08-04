import Link from "next/link";
import Image from "next/image";

// Moldura das telas de acesso: coluna do formulário (esq) + coluna de prova
// (dir, opcional). Track direita é `auto` — some quando `proof` é false.
export default function AuthShell({
  children,
  proof = true,
}: {
  children: React.ReactNode;
  proof?: boolean;
}) {
  return (
    <main style={{ minHeight: "100vh", background: "var(--color-bg)", display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto" }}>
      <div style={{ display: "flex", flexDirection: "column", padding: 56, minHeight: "100vh" }}>
        <Link href="/" style={{ alignSelf: "flex-start" }}>
          <Image src="/klicka-logo.png" alt="klicka." width={90} height={22} style={{ height: 22, width: "auto" }} />
        </Link>
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div style={{ width: "100%", maxWidth: 400 }}>{children}</div>
        </div>
        <div style={{ display: "flex", gap: 18 }}>
          <Link href="/termos" style={{ fontSize: 12, color: "var(--color-neutral-500)", textDecoration: "none" }}>Termos</Link>
          <Link href="/privacidade" style={{ fontSize: 12, color: "var(--color-neutral-500)", textDecoration: "none" }}>Privacidade</Link>
          <a href="#ajuda" style={{ fontSize: 12, color: "var(--color-neutral-500)", textDecoration: "none" }}>Ajuda</a>
        </div>
      </div>

      {proof && (
        <aside
          className="hide-narrow"
          style={{
            borderLeft: "1px solid var(--color-divider)", padding: "56px 48px", width: 440,
            background: "linear-gradient(200deg, color-mix(in srgb, var(--color-surface) 55%, transparent), transparent)",
            display: "flex", flexDirection: "column", justifyContent: "center", gap: 22,
          }}
        >
          <div>
            <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-accent)" }}>O que te espera</span>
            <h3 style={{ margin: "12px 0 0", maxWidth: "22ch" }}>Contatos de empresas locais, prontos pra prospectar.</h3>
          </div>
          <div style={{ borderRadius: "var(--radius-lg)", background: "var(--color-surface)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
            <table className="table" style={{ fontSize: 13 }}>
              <thead>
                <tr><th style={{ paddingLeft: 16 }}>Empresa</th><th>Telefone</th><th style={{ paddingRight: 16 }}>Site</th></tr>
              </thead>
              <tbody>
                <tr><td style={{ padding: "10px 8px 10px 16px", fontFamily: "var(--font-heading)" }}>Clínica Bellini</td><td className="text-muted" style={{ fontVariantNumeric: "tabular-nums" }}>(41) 3244-1180</td><td style={{ paddingRight: 16, color: "var(--color-neutral-300)" }}>bellini.com.br</td></tr>
                <tr><td style={{ padding: "10px 8px 10px 16px", fontFamily: "var(--font-heading)" }}>OdontoCenter</td><td className="text-muted" style={{ fontVariantNumeric: "tabular-nums" }}>(41) 3018-2260</td><td style={{ paddingRight: 16 }}><span className="tag tag-accent">sem site</span></td></tr>
                <tr><td style={{ padding: "10px 8px 10px 16px", fontFamily: "var(--font-heading)" }}>Ortoville</td><td className="text-muted" style={{ fontVariantNumeric: "tabular-nums" }}>(41) 3271-9080</td><td style={{ paddingRight: 16, color: "var(--color-neutral-300)" }}>ortoville.com</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>Uma busca por “Odontologia em Curitiba” devolve dezenas desses — com telefone, nota e endereço.</p>
        </aside>
      )}
    </main>
  );
}
