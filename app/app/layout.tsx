import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import { getUsage, creditsRemaining } from "@/lib/usage";
import Sidebar from "@/components/app/Sidebar";

// Shell do app: exige login, garante o usuário no banco e monta a moldura
// (sidebar 232px + conteúdo) que toda tela logada usa.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/app/buscar");

  const usage = await getUsage(user.id);
  const remaining = creditsRemaining(user, usage);

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", display: "grid", gridTemplateColumns: "232px minmax(0, 1fr)" }}>
      <Sidebar remaining={remaining} limit={user.plan.limits.creditsPerMonth} planName={user.plan.name} />
      <main style={{ minWidth: 0 }}>{children}</main>
    </div>
  );
}
