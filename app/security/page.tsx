import AppShell from "@/components/app-shell";
import PhoneSecurityForm from "@/components/phone-security-form";
import { requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const { email } = await requireUser();

  return (
    <AppShell email={email}>
      <section className="page-heading">
        <div>
          <p className="eyebrow">PROTECCIÓN DE ACCESO</p>
          <h1>Seguridad de la cuenta</h1>
          <p className="muted">Verifica tu celular para usarlo como método de recuperación.</p>
        </div>
      </section>
      <PhoneSecurityForm />
    </AppShell>
  );
}
