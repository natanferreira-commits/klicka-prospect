import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import { EnvelopeOpen } from "@phosphor-icons/react/dist/ssr";

export const metadata = { title: "Confirme seu e-mail · klicka." };

export default function ConfirmarPage() {
  return (
    <AuthShell proof={false}>
      <EnvelopeOpen size={26} color="var(--color-accent)" />
      <h1 style={{ fontSize: 38, letterSpacing: "-0.03em", margin: "16px 0 8px" }}>Confirme seu e-mail.</h1>
      <p className="text-muted" style={{ fontSize: 15, marginBottom: 20 }}>
        Enviamos um link de confirmação pro e-mail do seu cadastro. Clique nele pra ativar a conta e começar a buscar.
      </p>
      <Link className="btn btn-secondary" href="/entrar">Voltar para o login</Link>
    </AuthShell>
  );
}
