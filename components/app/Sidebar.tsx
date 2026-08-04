"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  MagnifyingGlass,
  ListChecks,
  ClockCounterClockwise,
  UserCircle,
} from "@phosphor-icons/react";

const NAV = [
  { href: "/app/buscar", label: "Nova busca", Icon: MagnifyingGlass, match: ["/app/buscar", "/app/buscas"] },
  { href: "/app/listas", label: "Minhas listas", Icon: ListChecks, match: ["/app/listas"] },
  { href: "/app/historico", label: "Histórico", Icon: ClockCounterClockwise, match: ["/app/historico"] },
  { href: "/conta", label: "Conta", Icon: UserCircle, match: ["/conta", "/app/conta"] },
];

export default function Sidebar({
  remaining,
  limit,
  planName,
}: {
  remaining: number;
  limit: number;
  planName: string;
}) {
  const pathname = usePathname();
  const pct = limit > 0 ? Math.round((remaining / limit) * 100) : 0;

  return (
    <aside
      style={{
        position: "sticky", top: 0, height: "100vh",
        padding: "24px 20px", borderRight: "1px solid var(--color-divider)",
        display: "flex", flexDirection: "column", gap: 26,
      }}
    >
      <Link href="/app/buscar" style={{ alignSelf: "flex-start", flex: "none" }}>
        <Image src="/klicka-logo.png" alt="klicka." width={82} height={20} style={{ height: 20, width: "auto" }} />
      </Link>

      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV.map(({ href, label, Icon, match }) => {
          const active = match.some((m) => pathname === m || pathname.startsWith(m + "/"));
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "7px 9px", borderRadius: "var(--radius-sm)",
                fontSize: 13, textDecoration: "none",
                color: active ? "var(--color-accent)" : "var(--color-neutral-300)",
                boxShadow: active ? "inset 0 0 0 1px var(--color-accent)" : "none",
              }}
            >
              <Icon size={15} /> {label}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <span className="text-muted" style={{ fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
              {remaining.toLocaleString("pt-BR")} créditos
            </span>
            <span className="text-muted" style={{ fontSize: 10 }}>{planName}</span>
          </div>
          <div style={{ height: 3, borderRadius: 2, background: "var(--color-neutral-800)" }}>
            <div style={{ height: 3, width: `${pct}%`, borderRadius: 2, background: "var(--color-accent)" }} />
          </div>
        </div>
        <form action="/auth/signout" method="post">
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: 0 }}>Sair</button>
        </form>
      </div>
    </aside>
  );
}
