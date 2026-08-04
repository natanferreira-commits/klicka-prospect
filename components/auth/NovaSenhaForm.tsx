"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClockCountdown } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

const LABELS = ["Muito curta", "Fraca", "Boa", "Forte"];

function strength(p: string): number {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[a-zA-Z]/.test(p) && /[0-9]/.test(p)) s++;
  if (p.length >= 12 || /[^a-zA-Z0-9]/.test(p)) s++;
  return s; // 0..3
}

export default function NovaSenhaForm() {
  const router = useRouter();
  const [ready, setReady] = useState<boolean | null>(null); // tem sessão de recuperação?
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setReady(!!data.user));
  }, []);

  const s = strength(password);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (s < 1) { setError("Senha muito curta."); return; }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError("Não deu pra salvar. Peça um novo link."); return; }
    router.push("/app/buscar");
    router.refresh();
  }

  if (ready === null) return <p className="text-muted" style={{ fontSize: 14 }}>Carregando…</p>;

  if (!ready) {
    return (
      <div>
        <ClockCountdown size={26} color="var(--color-neutral-500)" />
        <h1 style={{ fontSize: 38, letterSpacing: "-0.03em", margin: "16px 0 8px" }}>Esse link expirou.</h1>
        <p className="text-muted" style={{ fontSize: 15, marginBottom: 20 }}>Os links de redefinição valem por 30 minutos. Peça um novo.</p>
        <Link className="btn btn-primary" href="/recuperar">Pedir novo link</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 38, letterSpacing: "-0.03em", marginBottom: 8 }}>Defina a nova senha.</h1>
      <p className="text-muted" style={{ fontSize: 15, marginBottom: 28 }}>Ao salvar, as outras sessões da sua conta são encerradas.</p>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div className="field">
          <label>Nova senha</label>
          <input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8 caracteres, com uma letra e um número" style={{ minHeight: 44 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <div style={{ display: "flex", gap: 4, flex: 1 }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i < s ? "var(--color-accent)" : "var(--color-neutral-800)" }} />
              ))}
            </div>
            <span className="text-muted" style={{ fontSize: 11, width: 70, textAlign: "right" }}>{password ? LABELS[s] : ""}</span>
          </div>
        </div>
        {error && <div style={{ fontSize: 12, color: "var(--color-accent-300)" }}>{error}</div>}
        <button className="btn btn-primary btn-block" disabled={loading} style={{ height: 44 }}>{loading ? "..." : "Salvar nova senha"}</button>
      </form>
    </div>
  );
}
