import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user";

// Layout do produto: exige login (o proxy ja protege, isso e cinto+suspensorio)
// e garante a linha do usuario no banco no primeiro acesso.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/app");

  return <>{children}</>;
}
