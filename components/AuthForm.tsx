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
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
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
        // Se a confirmacao de email estiver desligada, ja vem sessao: entra direto.
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
      <div className="text-center">
        <div className="text-4xl mb-4">📬</div>
        <h2 className="text-xl font-semibold text-neutral-100 mb-2">
          Confira seu email
        </h2>
        <p className="text-neutral-400 text-sm">
          Enviamos um link de confirmação pra <b className="text-neutral-200">{email}</b>.
          Clica nele pra ativar sua conta.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-1.5">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@email.com"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder:text-neutral-600 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-1.5">
          Senha
        </label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isLogin ? "sua senha" : "mínimo 6 caracteres"}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder:text-neutral-600 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/60 text-red-200 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-purple-500 hover:bg-purple-400 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 font-semibold text-sm transition-colors shadow-lg shadow-purple-500/20"
      >
        {loading ? "..." : isLogin ? "Entrar" : "Criar conta grátis"}
      </button>
    </form>
  );
}

function traduzErro(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Email ou senha incorretos.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Esse email já tem conta. Tenta entrar.";
  if (m.includes("password")) return "Senha muito curta (mínimo 6 caracteres).";
  if (m.includes("email")) return "Email inválido.";
  return "Deu ruim: " + msg;
}
