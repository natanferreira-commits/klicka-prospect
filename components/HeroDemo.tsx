"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";

// Demo da hero. Dados plausiveis por cidade (bairro real + DDD certo), como
// o DS exige. Em producao isto vira a busca real limitada (4 contatos, resto
// travado). Numeros e leads sao placeholders.
type Lead = {
  name: string;
  bairro: string;
  phone: string;
  site: string | null;
  rating: string;
  reviews: number;
};

const CITIES: Record<string, { ddd: string; bairros: string[] }> = {
  "Curitiba, PR": { ddd: "41", bairros: ["Batel", "Água Verde", "Centro", "Portão", "Bigorrilho"] },
  "São Paulo, SP": { ddd: "11", bairros: ["Pinheiros", "Moema", "Itaim Bibi", "Vila Mariana", "Perdizes"] },
  "Rio de Janeiro, RJ": { ddd: "21", bairros: ["Copacabana", "Tijuca", "Botafogo", "Barra", "Ipanema"] },
};

const NICHES = ["Odontologia", "Estética", "Advocacia", "Contabilidade", "Pet shop", "Academia"];

const NAMES: Record<string, string[]> = {
  Odontologia: ["Clínica Odonto Sorriso", "OdontoCompany", "Dr. Rafael Mendonça", "Sorridents", "Clínica Dental Vitória", "Espaço Oral", "Instituto do Sorriso"],
  Estética: ["Studio Bella Pele", "Espaço Renove", "Clínica Estética Lumière", "Belle Estética", "Derma Center", "Beleza Pura", "Estúdio Glow"],
  Advocacia: ["Mendes & Associados", "Escritório Ribeiro Adv.", "Costa Advocacia", "Lima Sociedade de Advogados", "Barros & Cia", "Advocacia Nunes", "Oliveira Legal"],
  Contabilidade: ["Contábil Prisma", "Escritório Alfa Contábil", "Nova Contabilidade", "Contmais", "Gestão Contábil BR", "Ápice Contábil", "Contabilidade União"],
  "Pet shop": ["Mundo Pet", "Pet Center Amigo", "Cão & Cia", "Petland", "Amor de Bicho", "Reino Animal", "Patas & Focinhos"],
  Academia: ["Smart Fit", "Academia Corpo em Forma", "Studio Fit", "PowerGym", "Espaço Movimento", "BodyTech", "Academia Impacto"],
};

function build(niche: string, region: string): Lead[] {
  const city = CITIES[region] ?? CITIES["Curitiba, PR"];
  const names = NAMES[niche] ?? NAMES.Odontologia;
  const phones = ["3244-1180", "3018-2260", "99812-0034", "3271-9080", "99745-2201", "3335-4412", "99620-7788"];
  const sites = ["clinicax.com.br", null, "sorrisocwb.com", null, "dentalvitoria.com.br", "espacooral.com", null];
  const ratings = ["4.8", "4.6", "5.0", "4.5", "4.7", "4.9", "4.4"];
  const reviews = [214, 388, 92, 147, 203, 61, 128];
  return names.map((name, i) => ({
    name,
    bairro: city.bairros[i % city.bairros.length],
    phone: `(${city.ddd}) ${phones[i]}`,
    site: sites[i],
    rating: ratings[i],
    reviews: reviews[i],
  }));
}

export default function HeroDemo() {
  const [niche, setNiche] = useState("Odontologia");
  const [region, setRegion] = useState("Curitiba, PR");
  const [applied, setApplied] = useState({ niche: "Odontologia", region: "Curitiba, PR" });

  const leads = useMemo(() => build(applied.niche, applied.region), [applied]);
  const semSite = leads.filter((l) => !l.site).length;
  const free = leads.slice(0, 4);
  const locked = leads.slice(4);

  function run() {
    setApplied({ niche, region });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      {/* linha de busca */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-accent)" }} />
          <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-accent)" }}>
            Demonstração ao vivo — busque agora
          </span>
        </div>
        <div
          className="elev-sm"
          style={{
            display: "flex", flexWrap: "wrap", gap: "var(--space-3)",
            background: "color-mix(in srgb, var(--color-surface) 80%, transparent)",
            borderRadius: "var(--radius-lg)", padding: "var(--space-6)",
          }}
        >
          <div className="field" style={{ flex: "1 1 220px" }}>
            <label>Nicho</label>
            <select className="input" value={niche} onChange={(e) => setNiche(e.target.value)}>
              {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="field" style={{ flex: "1 1 260px" }}>
            <label>Região</label>
            <input
              className="input" value={region}
              onChange={(e) => setRegion(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") run(); }}
              list="cidades" placeholder="Cidade, UF"
            />
            <datalist id="cidades">
              {Object.keys(CITIES).map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="field" style={{ display: "flex", alignItems: "flex-end" }}>
            <button className="btn btn-primary" style={{ height: 44, paddingInline: 16 }} onClick={run}>
              <MagnifyingGlass size={17} /> Buscar
            </button>
          </div>
        </div>
      </div>

      {/* painel de resultado */}
      <div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: "var(--space-4)" }}>
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 17 }}>
              {applied.niche} em {applied.region}
            </div>
            <div className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>
              {leads.length} negócios encontrados · {semSite} sem site
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <span className="tag tag-neutral">CSV</span>
            <span className="tag tag-neutral">Excel</span>
            <span className="tag tag-outline">Enviar pro CRM</span>
          </div>
        </div>

        <div className="elev-md" style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--color-surface)" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Telefone</th>
                  <th>Site</th>
                  <th style={{ textAlign: "right" }}>Nota</th>
                  <th style={{ textAlign: "right" }}>Avaliações</th>
                </tr>
              </thead>
              <tbody>
                {free.map((l) => <Row key={l.name} l={l} />)}
              </tbody>
            </table>
          </div>

          {/* paywall */}
          <div style={{ position: "relative" }}>
            <div style={{ filter: "blur(4px)", opacity: 0.5, pointerEvents: "none" }}>
              <table className="table">
                <tbody>
                  {locked.map((l) => <Row key={l.name} l={l} />)}
                </tbody>
              </table>
            </div>
            <div
              style={{
                position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: "var(--space-3)", textAlign: "center",
                background: "linear-gradient(to bottom, transparent, var(--color-surface) 72%)",
              }}
            >
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 16 }}>
                +{locked.length} contatos nesta busca
              </span>
              <a className="btn btn-primary" href="/cadastro" style={{ height: 44, paddingInline: 16 }}>
                Liberar a lista completa
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ l }: { l: Lead }) {
  return (
    <tr>
      <td>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 14 }}>{l.name}</div>
        <div className="text-muted" style={{ fontSize: 11 }}>{l.bairro}</div>
      </td>
      <td style={{ fontVariantNumeric: "tabular-nums" }}>{l.phone}</td>
      <td>
        {l.site
          ? <a href={`https://${l.site}`} onClick={(e) => e.preventDefault()}>{l.site}</a>
          : <span className="tag tag-accent">sem site</span>}
      </td>
      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{l.rating}</td>
      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{l.reviews}</td>
    </tr>
  );
}
