import Link from "next/link";
import AuthForm from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <Link className="auth-back" href="/">← Finora</Link>
      <AuthForm mode="signup" />
    </main>
  );
}