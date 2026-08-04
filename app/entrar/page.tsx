import Link from "next/link";
import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Entrar · klicka." };

export default function EntrarPage() {
  return (
    <AuthShell>
      <h1 style={{ fontSize: 38, letterSpacing: "-0.03em", marginBottom: 8 }}>Bem-vindo de volta.</h1>
      <p className="text-muted" style={{ fontSize: 15, marginBottom: 28 }}>Entre pra continuar prospectando.</p>
      <Suspense><AuthForm mode="login" /></Suspense>
      <p className="text-muted" style={{ fontSize: 14, marginTop: 24 }}>
        Ainda não tem conta? <Link href="/cadastro">Criar conta grátis</Link>
      </p>
    </AuthShell>
  );
}
