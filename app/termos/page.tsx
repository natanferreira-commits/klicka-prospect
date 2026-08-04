import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Termos de uso · klicka." };

export default function TermosPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--color-bg)", padding: "64px 32px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <Link href="/"><Image src="/klicka-logo.png" alt="klicka." width={82} height={20} style={{ height: 20, width: "auto", marginBottom: 34 }} /></Link>
        <h1 style={{ marginBottom: 12 }}>Termos de uso</h1>
        <p className="text-muted" style={{ fontSize: 15 }}>
          Documento em elaboração. A klicka. entrega dados de negócios manifestamente públicos,
          coletados via API do Google Maps, para uso em prospecção B2B. O uso da ferramenta
          implica responsabilidade do usuário quanto à abordagem comercial dos contatos,
          respeitando a legislação vigente.
        </p>
      </div>
    </main>
  );
}
