"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MagnifyingGlass, DownloadSimple } from "@phosphor-icons/react";
import Resultado, { type ResultadoSummary } from "@/components/app/Resultado";

// Termos do placeholder animado do campo de nicho (efeito máquina de escrever).
const PLACEHOLDERS = ["Pet shops", "Clínicas de estética", "Academias", "Restaurantes", "Escritórios de advocacia", "Oficinas mecânicas"];
const REACHES = [
  { key: "cidade", label: "Só a cidade" },
  { key: "metro", label: "Região metropolitana" },
  { key: "estado", label: "Estado inteiro" },
];
// Sugestões de partida enquanto não há histórico próprio.
const NICHOS_SUGERIDOS = ["Pet shops", "Clínicas de estética", "Academias", "Odontologia", "Restaurantes", "Advocacia"];

const RECENT_KEY = "klicka:recentes";

type Busca = { niche: string; region: string; reach: string };
type Est = { estimate: number; remaining: number; after: number; insufficient: boolean };
type Recent = Busca & { ts: number };

function fmtData(ts: number): string {
  try { return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }); } catch { return ""; }
}

function BuscarInner() {
  const router = useRouter();
  const params = useSearchParams();

  // Rascunho: o que a pessoa está digitando agora.
  const [niche, setNiche] = useState("");
  const [region, setRegion] = useState("");
  const [reach, setReach] = useState("metro");
  // Busca executada: a que foi confirmada e paga. A lista lê SEMPRE daqui.
  const [busca, setBusca] = useState<Busca | null>(null);

  const [confirm, setConfirm] = useState(false);
  const [est, setEst] = useState<Est | null>(null);
  const [ph, setPh] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [summary, setSummary] = useState<ResultadoSummary | null>(null);
  const [recentes, setRecentes] = useState<Recent[]>([]);

  // Hidrata rascunho a partir do onboarding/URL e histórico do localStorage.
  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      if (Array.isArray(r)) setRecentes(r);
    } catch {}
    const pN = params.get("niche");
    const pR = params.get("region");
    const pReach = params.get("reach");
    if (pReach) setReach(pReach);
    if (pR) setRegion(pR);
    if (pN) setNiche(pN);
    // Reabertura: com nicho E região na URL, carrega como busca já executada,
    // sem modal e sem cobrar. O onboarding manda só a região, então não dispara.
    if (pN && pR) setBusca({ niche: pN, region: pR, reach: pReach || "metro" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Estimativa real: sai da API, com debounce, a partir do rascunho.
  useEffect(() => {
    if (niche.trim().length < 2) { setEst(null); return; }
    const t = setTimeout(async () => {
      const p = new URLSearchParams({ niche, region: region || "Curitiba, PR", reach });
      try {
        const r = await fetch(`/api/estimate?${p}`);
        if (r.ok) setEst(await r.json());
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [niche, region, reach]);

  // Placeholder do nicho se digita sozinho enquanto o campo está vazio. Pausa
  // com conteúdo. setTimeout encadeado porque os atrasos variam entre as fases.
  useEffect(() => {
    if (niche) { setPh(""); return; }
    let word = 0, char = 0, dir = 1;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const target = PLACEHOLDERS[word];
      char += dir;
      setPh(target.slice(0, char));
      let delay = dir > 0 ? 68 : 32;
      if (dir > 0 && char >= target.length) { dir = -1; delay = 1700; }
      else if (dir < 0 && char <= 0) { dir = 1; word = (word + 1) % PLACEHOLDERS.length; delay = 300; }
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, 500);
    return () => clearTimeout(timer);
  }, [niche]);

  const handleSummary = useCallback((s: ResultadoSummary) => setSummary(s), []);

  function openConfirm() {
    const n = niche.trim() || ph;
    if (!n) return;
    if (!niche.trim()) setNiche(n);
    setConfirm(true);
  }

  function runSearch() {
    const n = (niche.trim() || ph).trim();
    const r = region.trim() || "Curitiba, PR";
    if (!n) { setConfirm(false); return; }
    const b: Busca = { niche: n, region: r, reach };
    setBusca(b);
    setSummary(null);
    setConfirm(false);
    router.replace(`/app/buscar?${new URLSearchParams({ niche: n, region: r, reach })}`);
    setRecentes((prev) => {
      const dedup = prev.filter((x) => !(x.niche === n && x.region === r));
      const next = [{ ...b, ts: Date.now() }, ...dedup].slice(0, 6);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  // Reabrir do histórico não gasta crédito: carrega direto como busca executada.
  function reabrir(r: Recent) {
    setNiche(r.niche); setRegion(r.region); setReach(r.reach);
    setBusca({ niche: r.niche, region: r.region, reach: r.reach });
    setSummary(null);
    router.replace(`/app/buscar?${new URLSearchParams({ niche: r.niche, region: r.region, reach: r.reach })}`);
  }

  function limpar() {
    setBusca(null);
    setSummary(null);
    router.replace("/app/buscar");
  }

  const onEnter = (e: React.KeyboardEvent) => { if (e.key === "Enter") openConfirm(); };
  const cidade = (busca?.region || "").split(",")[0];
  const done = summary?.status === "done";

  return (
    <div>
      <style>{`@media (max-width: 900px){ .kl-continue-grid{ grid-template-columns: 1fr !important; gap: 40px !important; } }`}</style>

      {/* Topbar: troca de conteúdo conforme existe ou não busca ativa. */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 32px", borderBottom: "1px solid var(--color-divider)" }}>
        {busca ? (
          <>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 16 }}>{busca.niche} em {cidade}</span>
            {done && summary && (
              <span className="text-muted" style={{ fontSize: 13 }}>
                {summary.filtered} de {summary.total} contatos · {summary.semSite} sem site
              </span>
            )}
            <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button className="btn btn-secondary" onClick={limpar}>Limpar</button>
              <button className="btn btn-primary" onClick={() => setExportOpen(true)} disabled={!done || (summary?.filtered ?? 0) === 0}>
                <DownloadSimple size={15} /> Exportar
              </button>
            </span>
          </>
        ) : (
          <>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 16 }}>Buscar contatos</span>
            <span className="text-muted" style={{ fontSize: 13 }}>nicho e cidade bastam</span>
          </>
        )}
      </div>

      {/* Barra de busca: fixa no topo, junto do resultado. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: "18px 32px", borderBottom: "1px solid var(--color-divider)" }}>
        <input
          className="input" aria-label="Nicho" value={niche}
          onChange={(e) => setNiche(e.target.value)} onKeyDown={onEnter}
          placeholder={ph || "Pet shops, clínicas de estética, oficinas…"}
          style={{ flex: "2 1 260px", minHeight: 42, fontSize: 15 }}
        />
        <input
          className="input" aria-label="Cidade" value={region}
          onChange={(e) => setRegion(e.target.value)} onKeyDown={onEnter}
          placeholder="Curitiba, PR"
          style={{ flex: "1 1 160px", minHeight: 42, fontSize: 15 }}
        />
        <select className="input" aria-label="Alcance" value={reach} onChange={(e) => setReach(e.target.value)} style={{ flex: "0 1 200px", minHeight: 42, fontSize: 15 }}>
          {REACHES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>
        <button className="btn btn-primary" onClick={openConfirm} disabled={!niche.trim() && !ph} style={{ minHeight: 42, paddingInline: 20, fontSize: 15 }}>
          <MagnifyingGlass size={17} /> Buscar
        </button>

        {est && niche.trim().length > 1 && (
          <div style={{ flex: "1 1 100%", display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "4px 18px", animation: "klRise .16s ease-out" }}>
            <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-accent)" }}>Estimativa</span>
            <span style={{ fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{est.estimate} negócios</span>
            <span style={{ fontSize: 14, color: "var(--color-accent)", fontVariantNumeric: "tabular-nums" }}>{est.estimate} créditos</span>
            <span className="text-muted" style={{ fontSize: 12 }}>
              sobram {est.remaining.toLocaleString("pt-BR")} no mês, e contato repetido não é cobrado de novo
            </span>
          </div>
        )}
      </div>

      {/* Corpo: com busca ativa mostra o resultado; sem ela, "continue de onde parou". */}
      {busca ? (
        <Resultado niche={busca.niche} region={busca.region} onSummary={handleSummary} exportOpen={exportOpen} setExportOpen={setExportOpen} />
      ) : (
        <div style={{ padding: "40px 32px 120px" }}>
          <div className="kl-continue-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.35fr) minmax(0,1fr)", gap: 64, maxWidth: 1300 }}>
            <div>
              <h2 style={{ fontSize: 20, margin: "0 0 4px" }}>Continue de onde parou</h2>
              <p className="text-muted" style={{ fontSize: 13, margin: "0 0 20px" }}>Reabrir uma busca não gasta crédito.</p>
              {recentes.length === 0 ? (
                <p className="text-muted" style={{ fontSize: 13, maxWidth: "40ch" }}>
                  Suas buscas vão aparecer aqui. Escreva um nicho e uma cidade acima para começar.
                </p>
              ) : (
                <div>
                  {recentes.map((r, i) => (
                    <div key={`${r.niche}-${r.region}-${i}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: i ? "1px solid var(--color-divider)" : "none" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--font-heading)", fontSize: 14 }}>{r.niche}</div>
                        <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>{r.region} · {fmtData(r.ts)}</div>
                      </div>
                      <button className="btn btn-ghost" style={{ marginLeft: "auto" }} onClick={() => reabrir(r)}>Reabrir</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 style={{ fontSize: 20, margin: "0 0 4px" }}>Nichos pra começar</h2>
              <p className="text-muted" style={{ fontSize: 13, margin: "0 0 20px" }}>Clique para preencher o campo de nicho.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {NICHOS_SUGERIDOS.map((c) => (
                  <button key={c} className="btn btn-secondary" style={{ fontSize: 14, padding: "9px 16px" }} onClick={() => setNiche(c)}>{c}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <div className="dialog-backdrop" style={{ zIndex: 80 }} onClick={() => setConfirm(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-title">Gastar {est?.estimate ?? 0} créditos?</div>
            <p className="dialog-body" style={{ margin: 0 }}>
              Esta busca vai consumir cerca de {est?.estimate ?? 0} dos seus {(est?.remaining ?? 0).toLocaleString("pt-BR")} créditos.
              {est?.insufficient ? " Seu saldo cobre só parte, a gente entrega até onde der." : ""} Contato repetido não é cobrado de novo.
            </p>
            <div className="dialog-actions">
              <button className="btn btn-secondary" onClick={() => setConfirm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={runSearch}>Buscar contatos</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuscarPage() {
  return (
    <Suspense>
      <BuscarInner />
    </Suspense>
  );
}
