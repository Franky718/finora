import Link from "next/link";
import PasswordUpdateForm from "@/components/password-update-form";

export default function ResetPasswordPage() {
  return (
    <main className="auth-page">
      <Link className="auth-back" href="/">← Finora</Link>
      <PasswordUpdateForm />
    </main>
  );
}
