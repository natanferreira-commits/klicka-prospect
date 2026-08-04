import Link from "next/link";
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr";

export const metadata = { title: "Histórico · klicka." };

export default function HistoricoPage() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 32px", borderBottom: "1px solid var(--color-divider)" }}>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 16 }}>Histórico</span>
        <Link className="btn btn-primary" href="/app/buscar" style={{ marginLeft: "auto" }}>Nova busca</Link>
      </div>
      <div style={{ padding: "80px 32px", maxWidth: 900 }}>
        <ClockCounterClockwise size={26} color="var(--color-neutral-500)" />
        <h4 style={{ margin: "16px 0 6px" }}>Nenhuma busca ainda</h4>
        <p className="text-muted" style={{ fontSize: 13, maxWidth: "40ch", margin: "0 0 18px" }}>
          Toda busca vai ficar guardada aqui e reabre sem gastar crédito. Faça a primeira.
        </p>
        <Link className="btn btn-secondary" href="/app/buscar">Fazer uma busca</Link>
      </div>
    </div>
  );
}
