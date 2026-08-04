import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { PLANS, priceLabel, type Plan } from "@/lib/plans";
import HeroDemo from "@/components/HeroDemo";
import {
  Monitor,
  Target,
  InstagramLogo,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";

const LANDING_PAD = "0 32px";
const CONTAINER = { maxWidth: 1180, margin: "0 auto", padding: LANDING_PAD } as const;

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div style={{ background: "var(--color-bg)", color: "var(--color-text)" }}>
      {/* 1. TOPBAR */}
      <header
        style={{
          position: "sticky", top: 0, zIndex: 30,
          backdropFilter: "blur(14px)",
          background: "color-mix(in srgb, var(--color-bg) 78%, transparent)",
        }}
      >
        <div style={{ ...CONTAINER, display: "flex", alignItems: "center", gap: 24, height: 64 }}>
          <Image src="/klicka-logo.png" alt="klicka." width={98} height={24} style={{ height: 24, width: "auto", alignSelf: "center" }} priority />
          <nav style={{ display: "flex", gap: 22, marginLeft: 24 }} className="hide-sm">
            <a href="#como-funciona" style={{ color: "var(--color-neutral-300)", textDecoration: "none", fontSize: 14 }}>Como funciona</a>
            <a href="#para-quem" style={{ color: "var(--color-neutral-300)", textDecoration: "none", fontSize: 14 }}>Para quem é</a>
            <a href="#planos" style={{ color: "var(--color-neutral-300)", textDecoration: "none", fontSize: 14 }}>Planos</a>
          </nav>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            {user ? (
              <Link className="btn btn-primary" href="/app">Ir pro app</Link>
            ) : (
              <>
                <Link className="btn btn-ghost" href="/entrar">Entrar</Link>
                <Link className="btn btn-primary" href="/cadastro">Criar conta</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2 + 3 + 4. HERO com demo */}
      <section
        style={{
          position: "relative",
          background: `
            radial-gradient(48% 40% at 8% 0%, color-mix(in srgb, var(--color-accent) 13%, transparent), transparent 70%),
            radial-gradient(46% 44% at 96% 8%, color-mix(in srgb, var(--color-section-glow) 30%, transparent), transparent 72%)
          `,
        }}
      >
        <div style={{ ...CONTAINER, paddingTop: 88, paddingBottom: 72 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-accent)" }}>Prospecção local</span>
            <span style={{ width: 56, height: 1, background: "var(--color-accent)" }} />
            <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-accent)" }}>Dados do Google Maps</span>
          </div>
          <h1 style={{ fontSize: "clamp(40px, 5.4vw, 70px)", lineHeight: 1.02, letterSpacing: "-0.03em", maxWidth: "15ch", margin: "0 0 20px" }}>
            Escolha o nicho. Escolha a cidade. Receba os contatos.
          </h1>
          <p style={{ fontSize: 19, color: "var(--color-neutral-300)", maxWidth: "52ch", margin: "0 0 40px" }}>
            A klicka. varre os negócios locais no Google Maps e devolve nome, telefone, site, nota e avaliações — a lista pronta pra você prospectar quem vende pra empresa.
          </p>
          <HeroDemo />
        </div>
      </section>

      {/* 5. COMO FUNCIONA */}
      <section id="como-funciona" style={{ ...CONTAINER, paddingTop: 96, paddingBottom: 40 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 40 }}>
          {[
            { n: "01", t: "Escolha nicho e cidade", d: "“Odontologia em Curitiba”. A busca varre os negócios locais indexados no Google Maps." },
            { n: "02", t: "Receba os contatos", d: "Nome, telefone, site, endereço, nota e nº de avaliações de cada empresa — em segundos." },
            { n: "03", t: "Exporte e prospecte", d: "Baixe em CSV ou Excel, ou mande direto pro seu CRM. A lista sai pronta pra cadência." },
          ].map((s) => (
            <div key={s.n}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 13, color: "var(--color-accent)", fontFamily: "var(--font-heading)" }}>{s.n}</span>
                <span style={{ flex: 1, height: 1, background: "linear-gradient(to right, var(--color-divider), transparent)" }} />
              </div>
              <h4 style={{ marginBottom: 6 }}>{s.t}</h4>
              <p className="text-muted" style={{ fontSize: 14, margin: 0 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FAIXA DE NÚMEROS — única área saturada grande */}
      <section style={{ marginTop: 72 }}>
        <div style={{ background: "linear-gradient(120deg, var(--color-section), var(--color-section-glow))" }}>
          <div style={{ ...CONTAINER, padding: "72px 32px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 32 }}>
            {[
              { v: "2,4 mi", l: "negócios mapeados" },
              { v: "5.570", l: "cidades cobertas" },
              { v: "38 s", l: "por busca, em média" },
              { v: "11", l: "campos por contato" },
            ].map((s) => (
              <div key={s.l}>
                <div style={{ fontSize: "clamp(34px, 4vw, 52px)", fontFamily: "var(--font-heading)", fontWeight: 500, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
                <div style={{ fontSize: 13, color: "var(--color-accent-200)", marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. PARA QUEM É */}
      <section id="para-quem" style={{ ...CONTAINER, paddingTop: 96, paddingBottom: 40 }}>
        <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-accent)" }}>Para quem é</span>
        <h2 style={{ fontSize: "clamp(28px, 3.2vw, 42px)", letterSpacing: "-0.025em", margin: "14px 0 32px", maxWidth: "20ch" }}>Feito pra quem vende serviço pra empresa.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 }}>
          {[
            { Icon: Monitor, t: "Designers e devs", d: "Ache negócios sem site — os que mais precisam do seu trabalho." },
            { Icon: Target, t: "Gestores de tráfego", d: "Liste anunciantes em potencial por nicho e região." },
            { Icon: InstagramLogo, t: "Social media", d: "Encontre quem tem perfil fraco e proponha gestão." },
            { Icon: UsersThree, t: "Agências", d: "Abasteça a prospecção do time com listas frescas todo dia." },
          ].map(({ Icon, t, d }) => (
            <div key={t} className="card elev-sm">
              <Icon size={22} color="var(--color-accent)" />
              <div className="card-title">{t}</div>
              <p className="card-body">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. O QUE VEM EM CADA CONTATO */}
      <section style={{ ...CONTAINER, paddingTop: 56, paddingBottom: 40 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 40, alignItems: "start" }}>
          <div>
            <h2 style={{ fontSize: "clamp(28px, 3.2vw, 42px)", letterSpacing: "-0.025em", margin: "0 0 12px", maxWidth: "16ch" }}>O que vem em cada contato.</h2>
            <p className="text-muted" style={{ fontSize: 15, maxWidth: "44ch" }}>Cada linha da busca traz o que você precisa pra abordar o negócio certo, sem garimpar no Google na mão.</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["Nome do negócio", "Telefone", "WhatsApp", "Site", "Endereço completo", "Bairro", "Categoria", "Nota média", "Nº de avaliações", "Horário de funcionamento"].map((f) => (
              <span key={f} className="tag tag-neutral" style={{ fontSize: 13, padding: "7px 12px" }}>{f}</span>
            ))}
            <span className="tag tag-outline" style={{ fontSize: 13, padding: "7px 12px" }}>Link do perfil no Maps</span>
          </div>
        </div>
      </section>

      {/* 9. PLANOS */}
      <section id="planos" style={{ ...CONTAINER, paddingTop: 96, paddingBottom: 40 }}>
        <h2 style={{ fontSize: "clamp(28px, 3.2vw, 42px)", letterSpacing: "-0.025em", margin: "0 0 8px", textAlign: "center" }}>Planos</h2>
        <p className="text-muted" style={{ fontSize: 15, textAlign: "center", margin: "0 0 40px" }}>Comece grátis. Suba de plano quando precisar de volume.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, maxWidth: 900, margin: "0 auto" }}>
          {(Object.values(PLANS) as Plan[]).map((plan) => {
            const featured = plan.id === "pro";
            return (
              <div key={plan.id} className="card" style={featured ? { boxShadow: "inset 0 0 0 1px var(--color-accent)", background: "var(--color-surface)" } : { boxShadow: "var(--shadow-sm)" }}>
                <div style={{ height: 16 }}>
                  {featured && <span className="tag tag-accent" style={{ fontSize: 10 }}>mais assinado</span>}
                </div>
                <div className="card-title" style={{ fontSize: 20 }}>{plan.name}</div>
                <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>{plan.tagline}</p>
                <div style={{ margin: "10px 0 6px" }}>
                  <span style={{ fontSize: 34, fontFamily: "var(--font-heading)", fontWeight: 500, letterSpacing: "-0.02em" }}>{priceLabel(plan.priceMonthlyCents)}</span>
                  {plan.priceMonthlyCents > 0 && <span className="text-muted" style={{ fontSize: 13 }}> /mês</span>}
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 16px", display: "flex", flexDirection: "column", gap: 7, fontSize: 13, color: "var(--color-neutral-300)", flex: 1 }}>
                  <li>{plan.limits.creditsPerMonth.toLocaleString("pt-BR")} contatos por mês</li>
                  <li>{plan.limits.sources.length > 1 ? "Google Maps + Mercado Livre" : "Google Maps"}</li>
                  <li style={plan.limits.exportCsv ? undefined : { color: "var(--color-neutral-600)" }}>{plan.limits.exportCsv ? "Export CSV e Excel" : "Sem exportação"}</li>
                  <li style={plan.limits.historyDays ? undefined : { color: "var(--color-neutral-600)" }}>{plan.limits.historyDays ? "Histórico de buscas" : "Sem histórico"}</li>
                </ul>
                <Link className={`btn ${featured ? "btn-primary" : "btn-secondary"}`} href="/cadastro" style={{ width: "100%" }}>
                  {plan.priceMonthlyCents === 0 ? "Começar grátis" : "Assinar"}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* 10. FAQ */}
      <section style={{ ...CONTAINER, paddingTop: 96, paddingBottom: 40, maxWidth: 760 }}>
        <h2 style={{ fontSize: "clamp(28px, 3.2vw, 42px)", letterSpacing: "-0.025em", margin: "0 0 24px" }}>Perguntas frequentes</h2>
        {[
          { q: "De onde vêm os dados?", a: "Da API oficial do Google Maps. São dados públicos de negócios (nome, telefone, site, nota, endereço) — a klicka. só organiza e entrega pronto pra usar." },
          { q: "Preciso de cartão pra testar?", a: "Não. O plano Free deixa você buscar e ver os resultados sem cartão. Você só assina quando precisar de mais volume ou de exportar." },
          { q: "Os contatos estão atualizados?", a: "Cada busca é feita ao vivo no Maps, então você recebe o que está publicado naquele momento — não uma base velha revendida." },
          { q: "Consigo exportar a lista?", a: "Sim, nos planos pagos: baixe em CSV ou Excel, ou mande direto pro seu CRM." },
        ].map((item) => (
          <details key={item.q} style={{ borderBottom: "1px solid var(--color-divider)", padding: "16px 0" }}>
            <summary style={{ cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", gap: 12, fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 16 }}>
              <span style={{ color: "var(--color-accent)", fontSize: 18, lineHeight: 1 }}>+</span>
              {item.q}
            </summary>
            <p className="text-muted" style={{ fontSize: 14, margin: "10px 0 0 30px" }}>{item.a}</p>
          </details>
        ))}
      </section>

      {/* 11. CTA FINAL */}
      <section style={{ ...CONTAINER, paddingTop: 72, paddingBottom: 96 }}>
        <div style={{ borderRadius: "var(--radius-lg)", padding: "64px 48px", background: "linear-gradient(120deg, var(--color-accent-900), var(--color-surface))", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(28px, 3.2vw, 40px)", letterSpacing: "-0.025em", margin: "0 0 12px" }}>Sua próxima lista de clientes tá a uma busca de distância.</h2>
          <p className="text-muted" style={{ fontSize: 16, margin: "0 0 24px" }}>Crie sua conta grátis e faça a primeira busca agora.</p>
          <Link className="btn btn-primary" href="/cadastro" style={{ height: 44, paddingInline: 20 }}>Criar conta grátis</Link>
        </div>
      </section>

      {/* 12. FOOTER */}
      <footer>
        <div style={{ ...CONTAINER }}>
          <hr className="hr" />
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "8px 0 40px" }}>
            <Image src="/klicka-logo.png" alt="klicka." width={82} height={20} style={{ height: 20, width: "auto", opacity: 0.85, alignSelf: "flex-start" }} />
            <div style={{ display: "flex", gap: 22, fontSize: 13 }}>
              <a href="#como-funciona" style={{ color: "var(--color-neutral-400)", textDecoration: "none" }}>Como funciona</a>
              <a href="#planos" style={{ color: "var(--color-neutral-400)", textDecoration: "none" }}>Planos</a>
              <Link href="/termos" style={{ color: "var(--color-neutral-400)", textDecoration: "none" }}>Termos</Link>
              <Link href="/privacidade" style={{ color: "var(--color-neutral-400)", textDecoration: "none" }}>Privacidade</Link>
            </div>
            <span className="text-muted" style={{ fontSize: 12 }}>© {new Date().getFullYear()} klicka. · Grupo Dupla</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
