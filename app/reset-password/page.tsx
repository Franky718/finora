import Link from "next/link";
import PasswordUpdateForm from "@/components/password-update-form";
import { requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  await requireUser();
  return (
    <main className="auth-page">
      <Link className="auth-back" href="/">← Finora</Link>
      <PasswordUpdateForm />
    </main>
  );
}