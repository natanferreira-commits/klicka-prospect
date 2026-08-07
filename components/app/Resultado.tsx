"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  DownloadSimple, CircleNotch, FunnelX, X, Lightning,
  WhatsappLogo, ListPlus, CheckCircle,
} from "@phosphor-icons/react";
import type { SearchResult } from "@/lib/types";
import { isRealWebsite } from "@/lib/url-classifier";

const PER_PAGE = 8;

function waLink(phone: string | null): string | null {
  if (!phone) return null;
  const d = phone.replace(/\D/g, "");
  if (d.length < 10) return null;
  return `https://wa.me/55${d}`;
}

export type ResultadoSummary = { filtered: number; total: number; semSite: number; status: "loading" | "done" | "error" };

// Corpo do resultado da busca. A tela dona (a busca) desenha a topbar e a barra
// de busca, e passa o nicho e a região já confirmados. Este componente só cuida
// de rodar a busca, filtrar, paginar e mostrar a tabela, o drawer e a exportação.
export default function Resultado({
  niche, region,
  onSummary,
  exportOpen, setExportOpen,
}: {
  niche: string;
  region: string;
  onSummary?: (s: ResultadoSummary) => void;
  exportOpen: boolean;
  setExportOpen: (v: boolean) => void;
}) {
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [semSite, setSemSite] = useState(false);
  const [notaMin, setNotaMin] = useState("0");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [toast, setToast] = useState(false);
  const headRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    setSel(new Set());
    setPage(1);
    (async () => {
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: `${niche} em ${region}` }),
        });
        const data = await res.json();
        if (!alive) return;
        if (!res.ok) throw new Error(data.error ?? "erro na busca");
        setResults(data.results ?? []);
        setStatus("done");
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "erro");
        setStatus("error");
      }
    })();
    return () => { alive = false; };
  }, [niche, region, reload]);

  const filtered = useMemo(() => {
    const min = parseFloat(notaMin) || 0;
    return results.filter((r) => (!semSite || !isRealWebsite(r.website)) && (r.rating ?? 0) >= min);
  }, [results, semSite, notaMin]);

  const semSiteCount = results.filter((r) => !isRealWebsite(r.website)).length;

  useEffect(() => {
    onSummary?.({ filtered: filtered.length, total: results.length, semSite: semSiteCount, status });
  }, [filtered.length, results.length, semSiteCount, status, onSummary]);
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const cur = Math.min(page, pages);
  const start = (cur - 1) * PER_PAGE;
  const pageRows = filtered.slice(start, start + PER_PAGE);

  const idsOnPage = pageRows.map((r) => r.placeId);
  const pageMarked = idsOnPage.length > 0 && idsOnPage.every((i) => sel.has(i));
  const partial = idsOnPage.some((i) => sel.has(i)) && !pageMarked;
  useEffect(() => { if (headRef.current) headRef.current.indeterminate = partial; }, [partial, cur, filtered.length]);

  const toggle = useCallback((id: string) => setSel((p) => {
    const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n;
  }), []);
  function togglePage() {
    setSel((p) => {
      const n = new Set(p);
      if (pageMarked) idsOnPage.forEach((i) => n.delete(i));
      else idsOnPage.forEach((i) => n.add(i));
      return n;
    });
  }

  function clearFilters() { setSemSite(false); setNotaMin("0"); setPage(1); }

  function doExport() {
    const chosen = sel.size > 0 ? filtered.filter((r) => sel.has(r.placeId)) : filtered;
    const csv = Papa.unparse(chosen.map((r) => ({
      Nome: r.name, Telefone: r.phone ?? "", Site: r.website ?? "",
      Nota: r.rating ?? "", Avaliacoes: r.reviewCount ?? "",
      Endereco: r.address,
    })));
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url; a.download = `klicka-${niche}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    fetch("/api/log-export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ count: chosen.length }) }).catch(() => {});
    setExportOpen(false);
    setToast(true);
    setTimeout(() => setToast(false), 2600);
  }

  const lead = drawer ? results.find((r) => r.placeId === drawer) ?? null : null;
  const cidade = region.split(",")[0];

  return (
    <div>
      <div style={{ padding: "32px 32px 120px" }}>
        {/* filtros */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 16, marginBottom: 26 }}>
          <label className="check">
            <input type="checkbox" checked={semSite} onChange={() => { setSemSite((v) => !v); setPage(1); }} />
            <span className="box"><CheckIcon /></span> Só quem não tem site
          </label>
          <div className="field" style={{ minWidth: 150 }}>
            <label htmlFor="nota">Nota mínima</label>
            <select className="input" id="nota" value={notaMin} onChange={(e) => { setNotaMin(e.target.value); setPage(1); }}>
              <option value="0">Qualquer nota</option>
              <option value="4">4,0 ou mais</option>
              <option value="4.5">4,5 ou mais</option>
            </select>
          </div>
          <button className="btn btn-ghost" onClick={clearFilters} style={{ marginBottom: 4 }}>Limpar filtros</button>
        </div>

        {/* barra de seleção */}
        {sel.size > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "12px 18px", marginBottom: 14, borderRadius: "var(--radius-md)", background: "var(--color-surface)", boxShadow: "inset 0 0 0 1px var(--color-accent)" }}>
            <span style={{ fontSize: 14, color: "var(--color-accent)" }}>{sel.size} {sel.size === 1 ? "contato selecionado" : "contatos selecionados"}</span>
            <span style={{ marginLeft: "auto", display: "flex", flexWrap: "wrap", gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setExportOpen(true)}><DownloadSimple size={15} /> Exportar seleção</button>
              <button className="btn btn-secondary"><ListPlus size={15} /> Salvar como lista</button>
              <button className="btn btn-ghost" onClick={() => setSel(new Set())}>Limpar</button>
            </span>
          </div>
        )}

        {/* painel da tabela */}
        <div style={{ borderRadius: "var(--radius-lg)", background: "var(--color-surface)", boxShadow: "var(--shadow-md)", overflow: "hidden" }}>
          {status === "loading" && (
            <div style={{ padding: "18px 8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px 18px" }}>
                <CircleNotch size={16} color="var(--color-accent)" style={{ animation: "klSpin .8s linear infinite" }} />
                <span className="text-muted" style={{ fontSize: 13 }}>Varrendo {cidade}…</span>
              </div>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{ display: "flex", gap: 16, padding: "13px 14px", animation: "klPulse 1.1s ease-in-out infinite" }}>
                  <span style={{ height: 11, borderRadius: 3, background: "var(--color-neutral-700)", flex: 2.4 }} />
                  <span style={{ height: 11, borderRadius: 3, background: "var(--color-neutral-700)", flex: 1.1 }} />
                  <span style={{ height: 11, borderRadius: 3, background: "var(--color-neutral-700)", flex: 1.5 }} />
                  <span style={{ height: 11, borderRadius: 3, background: "var(--color-neutral-700)", flex: 0.6 }} />
                </div>
              ))}
            </div>
          )}

          {status === "error" && (
            <div style={{ padding: "56px 32px" }}>
              <h4 style={{ margin: "0 0 6px" }}>Deu erro na busca</h4>
              <p className="text-muted" style={{ fontSize: 13, margin: "0 0 18px" }}>{error}</p>
              <button className="btn btn-secondary" onClick={() => setReload((n) => n + 1)}>Tentar de novo</button>
            </div>
          )}

          {status === "done" && filtered.length > 0 && (
            <div>
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 44, paddingLeft: 20 }}>
                        <label className="check"><input ref={headRef} type="checkbox" checked={pageMarked} onChange={togglePage} /><span className="box"><CheckIcon /></span></label>
                      </th>
                      <th>Empresa</th>
                      <th>Telefone</th>
                      <th>Site</th>
                      <th style={{ textAlign: "right" }}>Nota</th>
                      <th style={{ textAlign: "right", paddingRight: 20 }}>Avaliações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r) => {
                      const real = isRealWebsite(r.website);
                      return (
                        <tr key={r.placeId}>
                          <td style={{ padding: "12px 8px 12px 20px" }}>
                            <label className="check"><input type="checkbox" checked={sel.has(r.placeId)} onChange={() => toggle(r.placeId)} /><span className="box"><CheckIcon /></span></label>
                          </td>
                          <td style={{ padding: "12px 8px", cursor: "pointer" }} onClick={() => setDrawer(r.placeId)}>
                            <div style={{ fontFamily: "var(--font-heading)" }}>{r.name}</div>
                            <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>{r.address}</div>
                          </td>
                          <td style={{ padding: "12px 8px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{r.phone ?? "—"}</td>
                          <td style={{ padding: "12px 8px" }}>
                            {real ? <span style={{ color: "var(--color-neutral-300)" }}>{r.website}</span> : <span className="tag tag-accent">sem site</span>}
                          </td>
                          <td style={{ padding: "12px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.rating != null ? r.rating.toFixed(1) : "—"}</td>
                          <td className="text-muted" style={{ padding: "12px 20px 12px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.reviewCount ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "14px 20px" }}>
                <span className="text-muted" style={{ fontSize: 12, marginRight: "auto" }}>
                  {filtered.length ? `${start + 1}–${Math.min(start + PER_PAGE, filtered.length)} de ${filtered.length}` : "0 de 0"}
                </span>
                {[...Array(pages)].map((_, i) => {
                  const n = i + 1;
                  return (
                    <button key={n} className="btn btn-secondary" onClick={() => setPage(n)}
                      style={{ minWidth: 34, ...(n === cur ? { color: "var(--color-accent)", borderColor: "var(--color-accent)" } : {}) }}>
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {status === "done" && filtered.length === 0 && (
            <div style={{ padding: "56px 32px" }}>
              <FunnelX size={26} color="var(--color-neutral-500)" />
              <h4 style={{ margin: "16px 0 6px" }}>Nada com esses filtros</h4>
              <p className="text-muted" style={{ fontSize: 13, maxWidth: "38ch", margin: "0 0 18px" }}>
                {results.length === 0 ? "A busca não retornou negócios nessa região." : "Os contatos existem, mas nenhum atende à combinação atual de filtros."}
              </p>
              {results.length > 0 && <button className="btn btn-secondary" onClick={clearFilters}>Limpar filtros</button>}
            </div>
          )}
        </div>
      </div>

      {/* drawer do lead */}
      {lead && (
        <div style={{ position: "fixed", inset: 0, zIndex: 80, background: "color-mix(in srgb, var(--color-neutral-900) 50%, transparent)" }} onClick={() => setDrawer(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "min(420px, 100%)", background: "var(--color-surface)", boxShadow: "var(--shadow-lg)", padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div className="card-kicker">{lead.category} · {lead.address.split(",")[0]}</div>
                <h3 style={{ margin: "6px 0 0" }}>{lead.name}</h3>
              </div>
              <button className="btn btn-icon btn-secondary" style={{ marginLeft: "auto", flex: "none" }} onClick={() => setDrawer(null)}><X size={15} /></button>
            </div>
            {!isRealWebsite(lead.website) && (
              <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 14px", borderRadius: "var(--radius-md)", boxShadow: "inset 0 0 0 1px var(--color-accent)" }}>
                <Lightning size={16} color="var(--color-accent)" />
                <span style={{ fontSize: 13, color: "var(--color-accent-300)" }}>Não tem site. Oportunidade quente</span>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 13, fontSize: 14 }}>
              <Pair k="Telefone" v={lead.phone ?? "—"} />
              {isRealWebsite(lead.website) && <Pair k="Site" v={lead.website ?? ""} />}
              <Pair k="Nota" v={lead.rating != null ? lead.rating.toFixed(1) : "—"} />
              <Pair k="Avaliações" v={String(lead.reviewCount ?? "—")} />
              <Pair k="Endereço" v={lead.address} />
            </div>
            <div style={{ height: 1, background: "var(--color-divider)" }} />
            <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
              {waLink(lead.phone) ? (
                <a className="btn btn-primary btn-block" style={{ margin: 0 }} href={waLink(lead.phone)!} target="_blank" rel="noopener noreferrer"><WhatsappLogo size={16} /> Abrir WhatsApp</a>
              ) : (
                <button className="btn btn-primary btn-block" style={{ margin: 0 }} disabled><WhatsappLogo size={16} /> Sem telefone</button>
              )}
              <button className="btn btn-secondary btn-block" style={{ margin: 0 }} onClick={() => navigator.clipboard?.writeText(`${lead.name} — ${lead.phone ?? ""}`)}>Copiar contato</button>
            </div>
          </div>
        </div>
      )}

      {/* modal de export */}
      {exportOpen && (
        <div className="dialog-backdrop" style={{ zIndex: 80 }} onClick={() => setExportOpen(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-title">Exportar contatos</div>
            <p className="dialog-body" style={{ margin: 0 }}>
              {sel.size > 0 ? `${sel.size} contatos selecionados` : `${filtered.length} contatos filtrados`}. A exportação não gasta crédito.
            </p>
            <div>
              <div className="text-muted" style={{ fontSize: 12, marginBottom: 8 }}>Campos incluídos</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["Nome", "Telefone", "Site", "Nota", "Avaliações", "Endereço"].map((f) => <span key={f} className="tag tag-neutral">{f}</span>)}
              </div>
            </div>
            <div className="dialog-actions">
              <button className="btn btn-secondary" onClick={() => setExportOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={doExport}>Exportar CSV</button>
            </div>
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 90, display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-surface)", boxShadow: "var(--shadow-lg)" }}>
          <CheckCircle size={18} color="var(--color-accent)" />
          <span style={{ fontSize: 14 }}>Arquivo gerado, o download começou</span>
        </div>
      )}
    </div>
  );
}

function CheckIcon() {
  return <svg width="11" height="11" viewBox="0 0 256 256" fill="currentColor"><path d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z" /></svg>;
}
function Pair({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span className="text-muted">{k}</span>
      <span style={{ textAlign: "right" }}>{v}</span>
    </div>
  );
}
