import Link from "next/link";
import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Criar conta · klicka." };

export default function CadastroPage() {
  return (
    <AuthShell>
      <h1 style={{ fontSize: 38, letterSpacing: "-0.03em", marginBottom: 8 }}>Crie sua conta.</h1>
      <p className="text-muted" style={{ fontSize: 15, marginBottom: 28 }}>Grátis. Sua primeira busca sai em minutos.</p>
      <Suspense><AuthForm mode="signup" /></Suspense>
      <p className="text-muted" style={{ fontSize: 14, marginTop: 24 }}>
        Já tem conta? <Link href="/entrar">Entrar</Link>
      </p>
    </AuthShell>
  );
}
