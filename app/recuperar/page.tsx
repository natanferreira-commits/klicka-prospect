import AuthShell from "@/components/auth/AuthShell";
import RecuperarForm from "@/components/auth/RecuperarForm";

export const metadata = { title: "Recuperar a senha · klicka." };

export default function RecuperarPage() {
  return (
    <AuthShell proof={false}>
      <RecuperarForm />
    </AuthShell>
  );
}
