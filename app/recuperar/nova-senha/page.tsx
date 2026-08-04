import AuthShell from "@/components/auth/AuthShell";
import NovaSenhaForm from "@/components/auth/NovaSenhaForm";

export const metadata = { title: "Nova senha · klicka." };

export default function NovaSenhaPage() {
  return (
    <AuthShell proof={false}>
      <NovaSenhaForm />
    </AuthShell>
  );
}
