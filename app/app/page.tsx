import { redirect } from "next/navigation";

// A ferramenta agora vive em /app/buscar (Nova busca) e /app/buscas (resultado).
export default function AppIndex() {
  redirect("/app/buscar");
}
