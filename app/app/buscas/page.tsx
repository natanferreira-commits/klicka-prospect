import { Suspense } from "react";
import Resultado from "@/components/app/Resultado";

export default function BuscasPage() {
  return (
    <Suspense>
      <Resultado />
    </Suspense>
  );
}
