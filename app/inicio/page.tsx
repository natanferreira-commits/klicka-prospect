"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";

const SERVICOS = ["Criação de site", "Gestão de tráfego", "Social media", "Identidade visual", "SEO local", "Automação e CRM"];
const REACHES = [
  { key: "cidade", label: "Só a cidade" },
  { key: "metro", label: "Região metropolitana" },
  { key: "estado", label: "Estado inteiro" },
];

export default function InicioPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [servicos, setServicos] = useState<string[]>([]);
  const [cidade, setCidade] = useState("");
  const [reach, setReach] = useState("metro");

  function toggle(s: string) {
    setServicos((p) => (p.includes(s) ? p.filter((x) => x !== s) : p.concat(s)));
  }

  function finish() {
    const p = new URLSearchParams();
    if (cidade) p.set("region", cidade);
    p.set("reach", reach);
    router.push(`/app/buscar?${p}`);
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--color-bg)", padding: 56 }}>
      <Link href="/"><Image src="/klicka-logo.png" alt="klicka." width={90} height={22} style={{ height: 22, width: "auto" }} /></Link>
      <div style={{ maxWidth: 560, margin: "64px auto 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-accent)" }}>Passo {step} de 2</span>
          <span style={{ width: 44, height: 1, background: "var(--color-accent)" }} />
        </div>

        {step === 1 ? (
          <div>
            <h1 style={{ fontSize: 38, letterSpacing: "-0.03em", marginBottom: 8 }}>O que você vende?</h1>
            <p className="text-muted" style={{ fontSize: 15, marginBottom: 28 }}>A gente usa isso pra sugerir os nichos certos pra você prospectar.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
              {SERVICOS.map((s) => {
                const on = servicos.includes(s);
                return (
                  <button key={s} className="btn btn-secondary" onClick={() => toggle(s)}
                    style={{ fontSize: 14, padding: "9px 16px", ...(on ? { boxShadow: "inset 0 0 0 1px var(--color-accent)", color: "var(--color-accent)" } : {}) }}>
                    {on && <Check size={14} />} {s}
                  </button>
                );
              })}
            </div>
            <button className="btn btn-primary" disabled={servicos.length === 0} onClick={() => setStep(2)} style={{ height: 44, paddingInline: 22 }}>Continuar</button>
          </div>
        ) : (
          <div>
            <h1 style={{ fontSize: 38, letterSpacing: "-0.03em", marginBottom: 8 }}>Onde você atua?</h1>
            <p className="text-muted" style={{ fontSize: 15, marginBottom: 28 }}>Sua cidade principal — dá pra mudar em qualquer busca.</p>
            <div className="field" style={{ maxWidth: 360, marginBottom: 22 }}>
              <label>Cidade principal</label>
              <input className="input" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade, estado" style={{ minHeight: 44 }} />
            </div>
            <div className="field" style={{ marginBottom: 32 }}>
              <label>Alcance</label>
              <span className="seg" style={{ marginTop: 2 }}>
                {REACHES.map((r) => (
                  <label key={r.key} className="seg-opt">
                    <input type="radio" name="reach" checked={reach === r.key} onChange={() => setReach(r.key)} />{r.label}
                  </label>
                ))}
              </span>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)} style={{ height: 44 }}>Voltar</button>
              <button className="btn btn-primary" onClick={finish} style={{ height: 44, paddingInline: 22 }}>Ir para a primeira busca</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
