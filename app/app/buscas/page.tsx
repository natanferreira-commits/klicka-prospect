import { redirect } from "next/navigation";

// A busca e o resultado vivem na mesma tela (/app/buscar). Esta rota antiga
// redireciona pra lá, preservando os parâmetros, para reabrir a busca.
export default async function BuscasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  for (const k of ["niche", "region", "reach"]) {
    const v = sp[k];
    if (typeof v === "string" && v) q.set(k, v);
  }
  const qs = q.toString();
  redirect(qs ? `/app/buscar?${qs}` : "/app/buscar");
}
