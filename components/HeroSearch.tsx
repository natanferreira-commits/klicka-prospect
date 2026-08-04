"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CHIPS = ["Dentistas", "Advocacia", "Pet Shop", "Estética", "Contabilidade"];

export default function HeroSearch() {
  const router = useRouter();
  const [what, setWhat] = useState("");
  const [where, setWhere] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Fundacao: leva pro cadastro ja com a busca guardada.
    // Fase 4: aqui roda a busca-demo real (limitada por IP) sem exigir login.
    const q = [what.trim(), where.trim()].filter(Boolean).join(" em ");
    const nextUrl = q ? `/app?q=${encodeURIComponent(q)}` : "/app";
    router.push(`/cadastrar?next=${encodeURIComponent(nextUrl)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-3 shadow-2xl shadow-purple-950/20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            value={what}
            onChange={(e) => setWhat(e.target.value)}
            placeholder="O que buscar (ex: Dentistas)"
            className="rounded-xl border border-neutral-700 bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            placeholder="Onde (ex: Niterói, RJ)"
            className="rounded-xl border border-neutral-700 bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button
          type="submit"
          className="mt-2 w-full rounded-xl bg-purple-500 hover:bg-purple-400 text-white px-4 py-3 font-semibold text-sm transition-colors shadow-lg shadow-purple-500/20"
        >
          Buscar leads grátis →
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setWhat(c)}
            className="text-xs px-3 py-1.5 rounded-full border border-neutral-800 text-neutral-400 hover:border-purple-500/50 hover:text-purple-200 transition-colors"
          >
            {c}
          </button>
        ))}
      </div>
    </form>
  );
}
