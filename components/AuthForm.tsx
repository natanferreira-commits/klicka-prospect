"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleLogo } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/app/buscar";

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
          options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}` },
        });
        if (error) throw error;
        if (data.session) { router.push(next); router.refresh(); }
        else setCheckEmail(true);
      }
    } catch (err) {
      setError(traduzErro(err instanceof Error ? err.message : "erro"));
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) setError("Login com Google indisponível no momento.");
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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div className="field">
          <label>{isLogin ? "E-mail" : "E-mail de trabalho"}</label>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" autoComplete="email" style={{ minHeight: 44 }} />
        </div>
        <div className="field">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <label style={{ margin: 0 }}>Senha</label>
            {isLogin && <Link href="/recuperar" style={{ fontSize: 12 }}>Esqueci a senha</Link>}
          </div>
          <input className="input" type="password" required minLength={isLogin ? 6 : 8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isLogin ? "sua senha" : "8 caracteres, com uma letra e um número"} autoComplete={isLogin ? "current-password" : "new-password"} style={{ minHeight: 44, marginTop: 5 }} />
        </div>

        {error && <div style={{ fontSize: 12, color: "var(--color-accent-300)" }}>{error}</div>}

        <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ height: 44 }}>
          {loading ? "..." : isLogin ? "Entrar" : "Criar conta"}
        </button>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--color-neutral-600)", fontSize: 11 }}>
        <span className="hr" style={{ flex: 1, margin: 0 }} /> OU <span className="hr" style={{ flex: 1, margin: 0 }} />
      </div>

      <button type="button" className="btn btn-secondary btn-block" onClick={google} style={{ height: 44, margin: 0 }}>
        <GoogleLogo size={17} /> Continuar com Google
      </button>

      {!isLogin && (
        <p className="text-muted" style={{ fontSize: 12, margin: 0 }}>
          Ao criar a conta você concorda com os <Link href="/termos">Termos</Link> e a <Link href="/privacidade">Privacidade</Link>.
        </p>
      )}
    </div>
  );
}

function traduzErro(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Esse e-mail já tem conta. Tente entrar.";
  if (m.includes("password")) return "Senha muito curta (mínimo 8 caracteres, com letra e número).";
  if (m.includes("email")) return "E-mail inválido.";
  return "Deu ruim: " + msg;
}
