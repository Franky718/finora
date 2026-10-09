import Link from "next/link";
import PasswordResetRequest from "@/components/password-reset-request";

export default function ForgotPasswordPage() {
  return (
    <main className="auth-page">
      <Link className="auth-back" href="/">← Finora</Link>
      <PasswordResetRequest />
    </main>
  );
}