import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Criar conta · klicka." };

export default function CadastroPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <Link href="/" style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <Image src="/klicka-logo.png" alt="klicka." width={98} height={24} style={{ height: 24, width: "auto" }} />
        </Link>
        <div className="card elev-sm" style={{ padding: "var(--space-8)", gap: "var(--space-6)" }}>
          <div>
            <h4 style={{ marginBottom: 4 }}>Criar conta</h4>
            <p className="text-muted" style={{ fontSize: 14, margin: 0 }}>Grátis. Sem cartão. Sua primeira busca sai em minutos.</p>
          </div>
          <Suspense>
            <AuthForm mode="signup" />
          </Suspense>
        </div>
        <p className="text-muted" style={{ textAlign: "center", fontSize: 14, marginTop: 20 }}>
          Já tem conta? <Link href="/entrar">Entrar</Link>
        </p>
      </div>
    </main>
  );
}
