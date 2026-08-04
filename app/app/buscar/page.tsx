"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react";

const NICHES = ["Odontologia", "Academias", "Restaurantes", "Pet shops", "Advocacia", "Estética e beleza", "Oficinas mecânicas"];
const REACHES = [
  { key: "cidade", label: "Só a cidade" },
  { key: "metro", label: "Região metropolitana" },
  { key: "estado", label: "Estado inteiro" },
];
const SUGESTOES = [
  { niche: "Estética e beleza", region: "Curitiba, PR" },
  { niche: "Odontologia", region: "Curitiba, PR" },
  { niche: "Academias", region: "Curitiba, PR" },
  { niche: "Restaurantes", region: "Curitiba, PR" },
];

type Est = { estimate: number; remaining: number; after: number; insufficient: boolean };

export default function BuscarPage() {
  const router = useRouter();
  const [niche, setNiche] = useState("Odontologia");
  const [region, setRegion] = useState("Curitiba, PR");
  const [reach, setReach] = useState("metro");
  const [est, setEst] = useState<Est | null>(null);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      const p = new URLSearchParams({ niche, region, reach });
      try {
        const r = await fetch(`/api/estimate?${p}`);
        if (r.ok) setEst(await r.json());
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [niche, region, reach]);

  function run() {
    setConfirm(false);
    const p = new URLSearchParams({ niche, region, reach });
    router.push(`/app/buscas?${p}`);
  }

  const estimate = est?.estimate ?? 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 32px", borderBottom: "1px solid var(--color-divider)" }}>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 16 }}>Nova busca</span>
      </div>

      <div style={{ padding: "56px 32px 120px", maxWidth: 880 }}>
        <h1 style={{ fontSize: 40, letterSpacing: "-0.03em", margin: "0 0 10px" }}>O que você quer prospectar?</h1>
        <p className="text-muted" style={{ fontSize: 15, maxWidth: "48ch", margin: "0 0 44px" }}>
          Nicho e cidade bastam. Você vê o custo em créditos antes de rodar — nada é cobrado sem confirmação.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18, maxWidth: 620 }}>
          <div className="field">
            <label htmlFor="n">Nicho</label>
            <select className="input" id="n" value={niche} onChange={(e) => setNiche(e.target.value)} style={{ minHeight: 44, fontSize: 15 }}>
              {NICHES.map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="r">Região</label>
            <input className="input" id="r" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Cidade, estado" style={{ minHeight: 44, fontSize: 15 }} />
          </div>
        </div>

        <div className="field" style={{ marginTop: 22 }}>
          <label>Alcance</label>
          <span className="seg" style={{ marginTop: 2 }}>
            {REACHES.map((r) => (
              <label key={r.key} className="seg-opt">
                <input type="radio" name="reach" checked={reach === r.key} onChange={() => setReach(r.key)} />
                {r.label}
              </label>
            ))}
          </span>
        </div>

        {/* Estimativa */}
        <div style={{ marginTop: 36, padding: 22, borderRadius: "var(--radius-lg)", background: "var(--color-surface)", boxShadow: "var(--shadow-sm)", maxWidth: 620 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "8px 26px" }}>
            <Metric label="Estimativa" value={`${estimate} negócios`} />
            <Metric label="Custo" value={`${estimate} créditos`} />
            <div style={{ marginLeft: "auto" }}>
              <div className="text-muted" style={{ fontSize: 12 }}>Depois da busca</div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, letterSpacing: "-0.02em", marginTop: 3, color: "var(--color-accent)", fontVariantNumeric: "tabular-nums" }}>
                {(est?.after ?? 0).toLocaleString("pt-BR")}
              </div>
            </div>
          </div>
          <p className="text-muted" style={{ fontSize: 12, margin: "16px 0 0" }}>
            Estimativa aproximada — o número real aparece no resultado. Contato que já saiu em busca anterior não é cobrado de novo.
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginTop: 28 }}>
          <button className="btn btn-primary" onClick={() => setConfirm(true)} disabled={!niche || !region} style={{ minHeight: 44, paddingInline: 22, fontSize: 15 }}>
            <MagnifyingGlass size={17} /> Buscar contatos
          </button>
          <span className="text-muted" style={{ fontSize: 13 }}>
            ou <a href="/app/historico">reabra uma busca antiga</a> sem gastar crédito
          </span>
        </div>

        <div style={{ marginTop: 72 }}>
          <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-accent)" }}>Sugestões pra começar</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            {SUGESTOES.map((s) => (
              <button key={s.niche} className="btn btn-secondary" onClick={() => { setNiche(s.niche); setRegion(s.region); }} style={{ fontSize: 14, padding: "9px 16px" }}>
                {s.niche} · {s.region.split(",")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {confirm && (
        <div className="dialog-backdrop" style={{ zIndex: 80 }} onClick={() => setConfirm(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-title">Gastar {estimate} créditos?</div>
            <p className="dialog-body" style={{ margin: 0 }}>
              Esta busca vai consumir cerca de {estimate} dos seus {(est?.remaining ?? 0).toLocaleString("pt-BR")} créditos.
              {est?.insufficient ? " Seu saldo cobre só parte — a gente entrega até onde der." : ""} Contato repetido não é cobrado de novo.
            </p>
            <div className="dialog-actions">
              <button className="btn btn-secondary" onClick={() => setConfirm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={run}>Buscar contatos</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted" style={{ fontSize: 12 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, letterSpacing: "-0.02em", marginTop: 3, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
}
