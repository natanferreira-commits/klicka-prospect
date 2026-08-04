"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/app";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next);
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push(next);
          router.refresh();
        } else {
          setCheckEmail(true);
        }
      }
    } catch (err) {
      setError(traduzErro(err instanceof Error ? err.message : "erro"));
    } finally {
      setLoading(false);
    }
  }

  if (checkEmail) {
    return (
      <div>
        <h5 style={{ marginBottom: 6 }}>Confira seu e-mail</h5>
        <p className="text-muted" style={{ fontSize: 14, margin: 0 }}>
          Enviamos um link de confirmação pra <span style={{ color: "var(--color-text)" }}>{email}</span>. Clique nele pra ativar sua conta.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className="field">
        <label>E-mail</label>
        <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" autoComplete="email" />
      </div>
      <div className="field">
        <label>Senha</label>
        <input className="input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isLogin ? "sua senha" : "mínimo 6 caracteres"} autoComplete={isLogin ? "current-password" : "new-password"} />
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-accent-300)" }}>
          {error}
        </div>
      )}

      <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ height: 44 }}>
        {loading ? "..." : isLogin ? "Entrar" : "Criar conta grátis"}
      </button>
    </form>
  );
}

function traduzErro(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Esse e-mail já tem conta. Tente entrar.";
  if (m.includes("password")) return "Senha muito curta (mínimo 6 caracteres).";
  if (m.includes("email")) return "E-mail inválido.";
  return "Deu ruim: " + msg;
}
