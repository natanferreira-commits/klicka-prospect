"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";
import type {
  SearchResult,
  EnrichmentResult,
  EnrichedRow,
  ScrapeStatus,
} from "@/lib/types";
import type { LocationSuggestion } from "@/lib/places";
import { isRealWebsite } from "@/lib/url-classifier";

type Stage = "search" | "results" | "enriched";
type Source = "places" | "mercadolivre";

const VERTICAL_CHIPS: Record<Source, string[]> = {
  places: [
    "Dentistas",
    "Fisioterapeutas",
    "Advocacia",
    "Contabilidade",
    "Pet Shop",
    "Estética",
  ],
  mercadolivre: [
    "Suplementos",
    "Moda fitness",
    "Pet",
    "Cosméticos",
    "Papelaria",
    "Utilidades",
  ],
};

type SiteFilter = "all" | "with_site" | "without_site";

type PlanInfo = {
  id: string;
  name: string;
  limits: {
    searchesPerMonth: number;
    resultsPerSearch: number;
    enrichPerMonth: number | null;
    sources: Source[];
    exportCsv: boolean;
    historyDays: number;
  };
};
type UsageInfo = {
  period: string;
  searches: number;
  leads: number;
  exports: number;
};

export default function Home() {
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [upgradeNotice, setUpgradeNotice] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("search");
  const [source, setSource] = useState<Source>("places");
  const [mlConnected, setMlConnected] = useState<boolean | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [whatQuery, setWhatQuery] = useState("");
  const [whereQuery, setWhereQuery] = useState("");
  const [whereSuggestions, setWhereSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [siteFilter, setSiteFilter] = useState<SiteFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [enriching, setEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState<{
    done: number;
    total: number;
  }>({ done: 0, total: 0 });
  const [enriched, setEnriched] = useState<EnrichedRow[]>([]);

  useEffect(() => {
    const trimmed = whereQuery.trim();
    if (trimmed.length < 2) {
      setWhereSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: trimmed }),
        });
        const data = await res.json();
        if (res.ok) setWhereSuggestions(data.suggestions ?? []);
      } catch {
        // silent, autocomplete is best-effort
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [whereQuery]);

  // Le o retorno do OAuth do ML (?ml=connected|error) so no mount e limpa a URL.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ml = params.get("ml");
    if (ml === "connected") {
      setSource("mercadolivre");
      setMlConnected(true);
      setNotice("Mercado Livre conectado. Pode buscar.");
    } else if (ml === "error") {
      setSource("mercadolivre");
      setMlConnected(false);
      setNotice("Falha ao conectar o ML: " + (params.get("ml_msg") ?? ""));
    }
    if (ml) window.history.replaceState({}, "", "/");
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Ao escolher a fonte ML, checa uma vez se ja existe token salvo.
  useEffect(() => {
    if (source !== "mercadolivre" || mlConnected !== null) return;
    fetch("/api/ml/status")
      .then((r) => r.json())
      .then((d) => setMlConnected(!!d.connected))
      .catch(() => setMlConnected(false));
  }, [source, mlConnected]);

  async function refreshMe() {
    try {
      const res = await fetch("/api/me");
      if (res.ok) {
        const d = await res.json();
        setPlan(d.plan);
        setUsage(d.usage);
      }
    } catch {
      // best-effort
    }
  }

  useEffect(() => {
    refreshMe();
  }, []);

  const canML = plan?.limits.sources.includes("mercadolivre") ?? false;

  function selectSuggestion(s: LocationSuggestion) {
    setWhereQuery(s.fullText);
    setShowSuggestions(false);
    setWhereSuggestions([]);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const what = whatQuery.trim();
    const where = whereQuery.trim();
    if (!what) return;
    if (source === "places" && !where) return;
    setLoading(true);
    setError(null);
    try {
      let data: {
        results?: SearchResult[];
        error?: string;
        needsAuth?: boolean;
        limitReached?: boolean;
      };
      if (source === "mercadolivre") {
        const res = await fetch("/api/ml-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: what }),
        });
        data = await res.json();
        if (res.status === 402 && data.limitReached) {
          setUpgradeNotice(data.error ?? "Limite atingido.");
          return;
        }
        if (res.status === 401 && data.needsAuth) {
          setMlConnected(false);
          throw new Error(
            data.error ?? "Conecte o Mercado Livre primeiro (botão acima).",
          );
        }
        if (!res.ok) throw new Error(data.error ?? "erro na busca");
      } else {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: `${what} em ${where}` }),
        });
        data = await res.json();
        if (res.status === 402 && data.limitReached) {
          setUpgradeNotice(data.error ?? "Limite atingido.");
          return;
        }
        if (!res.ok) throw new Error(data.error ?? "erro na busca");
      }
      setResults(data.results ?? []);
      setSelected(new Set());
      setStage("results");
      refreshMe();
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  const filteredResults = results.filter((r) => {
    const real = isRealWebsite(r.website);
    if (siteFilter === "with_site") return real;
    if (siteFilter === "without_site") return !real;
    return true;
  });
  const withSiteCount = results.filter((r) => isRealWebsite(r.website)).length;
  const withoutSiteCount = results.length - withSiteCount;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function selectAllVisible() {
    setSelected(new Set(filteredResults.map((r) => r.placeId)));
  }
  function selectNone() {
    setSelected(new Set());
  }

  async function handleEnrich() {
    const items = results.filter((r) => selected.has(r.placeId));
    if (items.length === 0) return;
    setEnriching(true);
    setError(null);
    setEnrichProgress({ done: 0, total: items.length });

    const CHUNK = 10;
    const allEnrichments: EnrichmentResult[] = [];
    const endpoint =
      source === "mercadolivre" ? "/api/ml-enrich" : "/api/enrich";

    for (let i = 0; i < items.length; i += CHUNK) {
      const chunk = items.slice(i, i + CHUNK).map((r) =>
        source === "mercadolivre"
          ? { placeId: r.placeId, name: r.name }
          : { placeId: r.placeId, website: r.website },
      );
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: chunk }),
        });
        const data = await res.json();
        if (res.status === 402 && data.limitReached) {
          setUpgradeNotice(data.error ?? "Limite de contatos atingido.");
          setEnriching(false);
          refreshMe();
          return;
        }
        if (!res.ok) throw new Error(data.error ?? "erro no enrich");
        allEnrichments.push(...(data.results ?? []));
        setEnrichProgress({
          done: Math.min(i + CHUNK, items.length),
          total: items.length,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "erro desconhecido");
        setEnriching(false);
        return;
      }
    }
    refreshMe();

    const map = new Map(allEnrichments.map((e) => [e.placeId, e]));
    const rows: EnrichedRow[] = items.map((r) => {
      const en = map.get(r.placeId) ?? {
        placeId: r.placeId,
        email: null,
        whatsapp: null,
        instagram: null,
        scrapeStatus: "empty" as ScrapeStatus,
      };
      // no fluxo ML, en.website traz o site descoberto; se nao achou,
      // mantem o link do perfil da loja (r.website).
      return { ...r, ...en, website: en.website ?? r.website };
    });

    setEnriched(rows);
    setEnriching(false);
    setStage("enriched");
  }

  function downloadCsv(rows: Record<string, string | number>[], suffix: string) {
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${suffix}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Gate de export: Free nao baixa. Pago registra o export e libera o download.
  async function guardExport(count: number): Promise<boolean> {
    if (plan && !plan.limits.exportCsv) {
      setUpgradeNotice("Baixar CSV é a partir do plano Pro.");
      return false;
    }
    try {
      const res = await fetch("/api/log-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      if (res.status === 402) {
        const d = await res.json();
        setUpgradeNotice(d.error ?? "Baixar CSV é a partir do plano Pro.");
        return false;
      }
    } catch {
      // se o log falhar, ainda deixa baixar (nao trava o usuario pago)
    }
    refreshMe();
    return true;
  }

  async function exportCsvFull() {
    if (!(await guardExport(enriched.length))) return;
    downloadCsv(
      enriched.map((r) => ({
        Nome: r.name,
        Categoria: r.category,
        Endereco: r.address,
        Telefone: r.phone ?? "",
        Email: r.email ?? "",
        WhatsApp: r.whatsapp ?? "",
        Instagram: r.instagram ?? "",
        Site: r.website ?? "",
        Rating: r.rating ?? "",
        Reviews: r.reviewCount ?? "",
        Status: r.scrapeStatus,
        GoogleMaps: r.googleMapsUri ?? "",
      })),
      "completo",
    );
  }

  async function exportCsvContacts() {
    const withContact = enriched.filter(
      (r) => r.phone || r.email || r.whatsapp,
    );
    if (!(await guardExport(withContact.length))) return;
    downloadCsv(
      withContact.map((r) => ({
        Nome: r.name,
        Telefone: r.phone ?? "",
        Email: r.email ?? "",
        WhatsApp: r.whatsapp ?? "",
      })),
      "contatos",
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex-1 flex flex-col">
      <header className="border-b border-neutral-800 bg-neutral-950/95 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight text-neutral-50">
            Klicka Prospect
          </h1>
          <div className="flex items-center gap-4">
            {plan && usage && (
              <span
                className="text-xs text-neutral-400"
                title={`Plano ${plan.name}`}
              >
                <span className="text-neutral-500">Buscas: </span>
                <span
                  className={
                    usage.searches >= plan.limits.searchesPerMonth
                      ? "text-amber-400 font-semibold"
                      : "text-neutral-200 font-semibold"
                  }
                >
                  {usage.searches}/{plan.limits.searchesPerMonth}
                </span>
                <span className="text-neutral-600"> · {plan.name}</span>
              </span>
            )}
            <a
              href="/conta"
              className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Minha conta
            </a>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-6 py-8 flex-1">
        {error && (
          <div className="mb-4 rounded border border-red-800 bg-red-950/60 text-red-200 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {upgradeNotice && (
          <div className="mb-4 rounded-lg border border-amber-700/60 bg-amber-950/40 text-amber-100 px-4 py-3 text-sm flex items-center justify-between gap-4">
            <span>🔒 {upgradeNotice}</span>
            <div className="flex items-center gap-3 shrink-0">
              <a
                href="/#precos"
                className="rounded bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 text-xs font-semibold transition-colors"
              >
                Ver planos
              </a>
              <button
                onClick={() => setUpgradeNotice(null)}
                className="text-amber-400/70 hover:text-amber-200 text-xs"
              >
                fechar
              </button>
            </div>
          </div>
        )}

        {notice && (
          <div className="mb-4 rounded border border-purple-800 bg-purple-950/50 text-purple-200 px-4 py-3 text-sm flex items-center justify-between gap-4">
            <span>{notice}</span>
            <button
              onClick={() => setNotice(null)}
              className="text-purple-400 hover:text-purple-200 text-xs"
            >
              fechar
            </button>
          </div>
        )}

        {stage === "search" && (
          <form
            onSubmit={handleSearch}
            className="mx-auto max-w-3xl mt-12"
          >
            <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
              <div className="inline-flex rounded-lg border border-neutral-700 p-1 bg-neutral-900">
                {(
                  [
                    { key: "places", label: "Google Maps" },
                    { key: "mercadolivre", label: "Mercado Livre" },
                  ] as { key: Source; label: string }[]
                ).map((s) => {
                  const locked = s.key === "mercadolivre" && plan != null && !canML;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => {
                        if (locked) {
                          setUpgradeNotice(
                            "O Mercado Livre está disponível a partir do plano Pro.",
                          );
                          return;
                        }
                        setSource(s.key);
                      }}
                      className={`text-sm px-4 py-1.5 rounded-md font-medium transition-colors ${
                        source === s.key
                          ? "bg-purple-500 text-white shadow"
                          : locked
                            ? "text-neutral-600"
                            : "text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      {locked ? "🔒 " : ""}
                      {s.label}
                    </button>
                  );
                })}
              </div>

              {source === "mercadolivre" && (
                <div className="text-sm">
                  {mlConnected === true && (
                    <span className="inline-flex items-center gap-1.5 text-green-300">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      Mercado Livre conectado
                    </span>
                  )}
                  {mlConnected === false && (
                    <a
                      href="/api/ml/authorize"
                      className="rounded bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-1.5 font-semibold transition-colors"
                    >
                      Conectar Mercado Livre
                    </a>
                  )}
                  {mlConnected === null && (
                    <span className="text-neutral-500">checando conexão...</span>
                  )}
                </div>
              )}
            </div>

            <div
              className={`grid grid-cols-1 gap-3 ${
                source === "places" ? "md:grid-cols-2" : ""
              }`}
            >
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  O que buscar
                </label>
                <input
                  value={whatQuery}
                  onChange={(e) => setWhatQuery(e.target.value)}
                  placeholder="Ex: Dentistas"
                  className="w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder:text-neutral-500 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              {source === "places" && (
              <div className="relative">
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Onde
                </label>
                <input
                  value={whereQuery}
                  onChange={(e) => {
                    setWhereQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowSuggestions(false), 200)
                  }
                  placeholder="Ex: Niterói, RJ"
                  className="w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder:text-neutral-500 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {showSuggestions && whereSuggestions.length > 0 && (
                  <ul className="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border border-neutral-700 rounded shadow-xl max-h-72 overflow-y-auto z-20">
                    {whereSuggestions.map((s) => (
                      <li key={s.placeId}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectSuggestion(s)}
                          className="w-full text-left px-4 py-2.5 hover:bg-neutral-800 border-b border-neutral-800 last:border-b-0 transition-colors"
                        >
                          <div className="text-neutral-100 text-sm font-medium">
                            {s.mainText}
                          </div>
                          {s.secondaryText && (
                            <div className="text-neutral-500 text-xs mt-0.5">
                              {s.secondaryText}
                            </div>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {VERTICAL_CHIPS[source].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setWhatQuery(chip)}
                  className={`text-xs px-3 py-1.5 border rounded-full transition-colors ${
                    whatQuery === chip
                      ? "border-purple-500 bg-purple-500/10 text-purple-200"
                      : "border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-600"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button
                type="submit"
                disabled={
                  loading ||
                  !whatQuery.trim() ||
                  (source === "places" && !whereQuery.trim()) ||
                  (source === "mercadolivre" && mlConnected !== true)
                }
                className="rounded bg-purple-500 hover:bg-purple-400 disabled:opacity-40 disabled:cursor-not-allowed text-white px-8 py-3 font-semibold transition-colors shadow-lg shadow-purple-500/20"
              >
                {loading ? "Buscando..." : "Buscar"}
              </button>
              <p className="text-xs text-neutral-500">
                {source === "mercadolivre"
                  ? "Busca nacional por lojas do nicho. Até ~30 lojas por busca."
                  : "Até 60 resultados por busca."}
              </p>
            </div>
          </form>
        )}

        {stage === "results" && (
          <div>
            <div className="flex items-center justify-between mb-3 gap-4 flex-wrap">
              <div className="text-sm text-neutral-300">
                <span className="font-semibold text-neutral-100">
                  {results.length}
                </span>{" "}
                resultados{" "}
                <span className="text-neutral-500">
                  ({withSiteCount} com site, {withoutSiteCount} sem site)
                </span>
                . Visível:{" "}
                <span className="font-semibold text-neutral-100">
                  {filteredResults.length}
                </span>
                . Selecionado:{" "}
                <span className="font-semibold text-neutral-100">
                  {selected.size}
                </span>
                .
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setStage("search")}
                  className="text-sm px-3 py-1.5 border border-neutral-700 text-neutral-200 rounded hover:bg-neutral-800 transition-colors"
                >
                  Nova busca
                </button>
                <button
                  onClick={selectAllVisible}
                  className="text-sm px-3 py-1.5 border border-neutral-700 text-neutral-200 rounded hover:bg-neutral-800 transition-colors"
                >
                  Todos visíveis
                </button>
                <button
                  onClick={selectNone}
                  className="text-sm px-3 py-1.5 border border-neutral-700 text-neutral-200 rounded hover:bg-neutral-800 transition-colors"
                >
                  Nenhum
                </button>
                <button
                  onClick={handleEnrich}
                  disabled={enriching || selected.size === 0}
                  className="text-sm px-4 py-1.5 bg-purple-500 hover:bg-purple-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded font-semibold shadow-lg shadow-purple-500/20 transition-colors"
                >
                  {enriching
                    ? `Extraindo ${enrichProgress.done}/${enrichProgress.total}...`
                    : `Extrair contatos (${selected.size})`}
                </button>
              </div>
            </div>

            <div className="mb-4 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-neutral-500 mr-1">Filtro:</span>
              {(
                [
                  { key: "all", label: "Todos", count: results.length },
                  {
                    key: "without_site",
                    label: "Sem site",
                    count: withoutSiteCount,
                  },
                  {
                    key: "with_site",
                    label: "Com site",
                    count: withSiteCount,
                  },
                ] as { key: SiteFilter; label: string; count: number }[]
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setSiteFilter(f.key)}
                  className={`text-xs px-3 py-1.5 border rounded-full transition-colors ${
                    siteFilter === f.key
                      ? "border-purple-500 bg-purple-500/15 text-purple-200"
                      : "border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:border-neutral-600"
                  }`}
                >
                  {f.label}{" "}
                  <span
                    className={
                      siteFilter === f.key
                        ? "text-purple-300/70"
                        : "text-neutral-500"
                    }
                  >
                    ({f.count})
                  </span>
                </button>
              ))}
            </div>

            <div className="overflow-x-auto rounded border border-neutral-800 bg-neutral-900">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-800/50 text-neutral-300">
                  <tr>
                    <th className="px-3 py-2 text-left w-8"></th>
                    <th className="px-3 py-2 text-left">Nome</th>
                    <th className="px-3 py-2 text-left">Categoria</th>
                    <th className="px-3 py-2 text-left">Endereço</th>
                    <th className="px-3 py-2 text-left">Rating</th>
                    <th className="px-3 py-2 text-left">Telefone</th>
                    <th className="px-3 py-2 text-left">Site</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-8 text-center text-neutral-500"
                      >
                        {results.length === 0
                          ? "Nenhum resultado."
                          : "Nenhum resultado com esse filtro."}
                      </td>
                    </tr>
                  )}
                  {filteredResults.map((r) => (
                    <tr
                      key={r.placeId}
                      className="border-t border-neutral-800 hover:bg-neutral-800/40 cursor-pointer transition-colors"
                      onClick={() => toggleSelect(r.placeId)}
                    >
                      <td
                        className="px-3 py-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(r.placeId)}
                          onChange={() => toggleSelect(r.placeId)}
                          className="cursor-pointer accent-purple-500"
                        />
                      </td>
                      <td className="px-3 py-2 font-medium text-neutral-100">
                        {r.name}
                      </td>
                      <td className="px-3 py-2 text-neutral-400">
                        {r.category}
                      </td>
                      <td className="px-3 py-2 text-neutral-400 max-w-xs truncate">
                        {r.address}
                      </td>
                      <td className="px-3 py-2 text-neutral-400">
                        {r.rating != null ? `★ ${r.rating.toFixed(1)}` : ""}
                        {r.reviewCount != null ? ` (${r.reviewCount})` : ""}
                      </td>
                      <td className="px-3 py-2 text-neutral-400">
                        {r.phone ?? ""}
                      </td>
                      <td
                        className="px-3 py-2 text-neutral-400 max-w-xs truncate"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {r.website ? (
                          <a
                            href={r.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 hover:underline"
                          >
                            {r.website}
                          </a>
                        ) : (
                          ""
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {stage === "enriched" && (
          <div>
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
              <div className="text-sm text-neutral-300">
                <span className="font-semibold text-neutral-100">
                  {enriched.length}
                </span>{" "}
                leads extraídos.{" "}
                <span className="text-neutral-500">
                  ({enriched.filter((r) => r.phone || r.email || r.whatsapp).length} com contato)
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setStage("results")}
                  className="text-sm px-3 py-1.5 border border-neutral-700 text-neutral-200 rounded hover:bg-neutral-800 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={exportCsvFull}
                  className="text-sm px-4 py-1.5 border border-purple-500/60 text-purple-200 rounded font-semibold hover:bg-purple-500/10 transition-colors"
                  title="Exporta tudo: nome, endereço, categoria, telefone, email, whatsapp, instagram, site, rating, googlemaps"
                >
                  CSV completo
                </button>
                <button
                  onClick={exportCsvContacts}
                  className="text-sm px-4 py-1.5 bg-purple-500 hover:bg-purple-400 text-white rounded font-semibold shadow-lg shadow-purple-500/20 transition-colors"
                  title="Só Nome, Telefone, Email, WhatsApp. Pronto pra subir na ferramenta de marketing."
                >
                  CSV contatos
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded border border-neutral-800 bg-neutral-900">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-800/50 text-neutral-300">
                  <tr>
                    <th className="px-3 py-2 text-left">Nome</th>
                    <th className="px-3 py-2 text-left">Categoria</th>
                    <th className="px-3 py-2 text-left">Rating</th>
                    <th className="px-3 py-2 text-left">Telefone</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">WhatsApp</th>
                    <th className="px-3 py-2 text-left">Instagram</th>
                    <th className="px-3 py-2 text-left">Links</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {enriched.map((r) => (
                    <tr
                      key={r.placeId}
                      className="border-t border-neutral-800 hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="px-3 py-2 align-top">
                        <div className="font-medium text-neutral-100">
                          {r.name}
                        </div>
                        {r.address && (
                          <div className="text-xs text-neutral-500 mt-0.5 max-w-xs truncate">
                            {r.address}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-neutral-400 align-top">
                        {r.category}
                      </td>
                      <td className="px-3 py-2 text-neutral-400 align-top whitespace-nowrap">
                        {r.rating != null
                          ? `★ ${r.rating.toFixed(1)}`
                          : ""}
                        {r.reviewCount != null && (
                          <span className="text-neutral-500">
                            {" "}
                            ({r.reviewCount})
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-neutral-300 align-top whitespace-nowrap">
                        {r.phone ?? ""}
                      </td>
                      <td className="px-3 py-2 text-neutral-300 align-top">
                        {r.email ?? ""}
                      </td>
                      <td className="px-3 py-2 text-neutral-300 align-top whitespace-nowrap">
                        {r.whatsapp ?? ""}
                      </td>
                      <td className="px-3 py-2 text-neutral-300 align-top">
                        {r.instagram ?? ""}
                      </td>
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        <div className="flex gap-2">
                          {r.website && (
                            <a
                              href={r.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-purple-400 hover:text-purple-300 hover:underline"
                            >
                              site
                            </a>
                          )}
                          {r.googleMapsUri && (
                            <a
                              href={r.googleMapsUri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-purple-400 hover:text-purple-300 hover:underline"
                            >
                              maps
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <StatusBadge status={r.scrapeStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ScrapeStatus }) {
  const config: Record<ScrapeStatus, { label: string; cls: string }> = {
    ok: { label: "ok", cls: "bg-green-500/15 text-green-300 border border-green-500/30" },
    empty: { label: "sem dado", cls: "bg-amber-500/15 text-amber-300 border border-amber-500/30" },
    no_website: {
      label: "sem site",
      cls: "bg-neutral-700/50 text-neutral-300 border border-neutral-600",
    },
    timeout: { label: "timeout", cls: "bg-red-500/15 text-red-300 border border-red-500/30" },
    parse_failed: { label: "falhou", cls: "bg-red-500/15 text-red-300 border border-red-500/30" },
  };
  const c = config[status];
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${c.cls}`}>
      {c.label}
    </span>
  );
}
