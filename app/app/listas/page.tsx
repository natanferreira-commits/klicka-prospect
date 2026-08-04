import Link from "next/link";
import { ListChecks } from "@phosphor-icons/react/dist/ssr";

export const metadata = { title: "Minhas listas · klicka." };

export default function ListasPage() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 32px", borderBottom: "1px solid var(--color-divider)" }}>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 16 }}>Minhas listas</span>
      </div>
      <div style={{ padding: "80px 32px" }}>
        <ListChecks size={26} color="var(--color-neutral-500)" />
        <h4 style={{ margin: "16px 0 6px" }}>Nenhuma lista ainda</h4>
        <p className="text-muted" style={{ fontSize: 13, maxWidth: "38ch", margin: "0 0 18px" }}>
          Selecione contatos no resultado de uma busca e salve como lista pra organizar sua carteira.
        </p>
        <Link className="btn btn-primary" href="/app/buscar">Fazer uma busca</Link>
      </div>
    </div>
  );
}
