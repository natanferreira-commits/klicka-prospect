import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Privacidade e LGPD · klicka." };

export default function PrivacidadePage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--color-bg)", padding: "64px 32px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <Link href="/"><Image src="/klicka-logo.png" alt="klicka." width={82} height={20} style={{ height: 20, width: "auto", marginBottom: 34 }} /></Link>
        <h1 style={{ marginBottom: 12 }}>Privacidade e LGPD</h1>
        <p className="text-muted" style={{ fontSize: 15 }}>
          Documento em elaboração. Os dados exibidos pela klicka. vêm da API oficial do Google
          Maps e são informações públicas de estabelecimentos comerciais. Titulares que desejem
          solicitar remoção ou correção de dados podem entrar em contato pelo e-mail de suporte —
          o canal e o fluxo completo serão detalhados aqui.
        </p>
      </div>
    </main>
  );
}
