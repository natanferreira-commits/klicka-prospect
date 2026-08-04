import Link from "next/link";
import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Criar conta · Klicka Leads" };

export default function CadastrarPage() {
  return (
    <main className="min-h-screen bg-neutral-950 flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="block text-center text-xl font-bold tracking-tight text-neutral-50 mb-8"
        >
          Klicka<span className="text-purple-400">Leads</span>
        </Link>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
          <h1 className="text-lg font-semibold text-neutral-100 mb-1">
            Criar conta
          </h1>
          <p className="text-sm text-neutral-500 mb-5">
            Grátis. Sem cartão. Comece a extrair leads em minutos.
          </p>
          <Suspense>
            <AuthForm mode="signup" />
          </Suspense>
        </div>
        <p className="text-center text-sm text-neutral-500 mt-5">
          Já tem conta?{" "}
          <Link href="/entrar" className="text-purple-400 hover:text-purple-300">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
