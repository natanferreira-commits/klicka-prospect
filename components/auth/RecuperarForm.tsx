"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, EnvelopeSimple } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

export default function RecuperarForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    // Não revela se o e-mail existe: mostra "enviado" de qualquer jeito.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/recuperar/nova-senha`,
    }).catch(() => {});
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div>
        <EnvelopeSimple size={26} color="var(--color-accent)" />
        <h1 style={{ fontSize: 38, letterSpacing: "-0.03em", margin: "16px 0 8px" }}>Link enviado.</h1>
        <p className="text-muted" style={{ fontSize: 15 }}>
          Se houver uma conta em <span style={{ color: "var(--color-text)" }}>{email}</span>, o link de redefinição chegou lá. Confira também o spam.
        </p>
        <button className="btn btn-secondary" style={{ marginTop: 20 }} onClick={() => setSent(false)}>Enviar de novo</button>
      </div>
    );
  }

  return (
    <div>
      <Link href="/entrar" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 20 }}>
        <ArrowLeft size={14} /> Voltar para o login
      </Link>
      <h1 style={{ fontSize: 38, letterSpacing: "-0.03em", marginBottom: 8 }}>Recuperar a senha.</h1>
      <p className="text-muted" style={{ fontSize: 15, marginBottom: 28 }}>A gente manda um link pro seu e-mail. Ele vale por 30 minutos.</p>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div className="field">
          <label>E-mail</label>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" style={{ minHeight: 44 }} />
        </div>
        <button className="btn btn-primary btn-block" disabled={loading} style={{ height: 44 }}>{loading ? "..." : "Enviar link"}</button>
      </form>
    </div>
  );
}
